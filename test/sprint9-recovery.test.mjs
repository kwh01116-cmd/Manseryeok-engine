import test from 'node:test';
import assert from 'node:assert/strict';
import {fork} from 'node:child_process';
import {once} from 'node:events';
import {mkdtemp,readFile,writeFile,readdir,lstat,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {openRecoveryApp,actors} from './fixtures/sprint9-recovery-child.mjs';

async function stopProcessAt(t,root,scenario) {
  const proc=fork(new URL('./fixtures/sprint9-recovery-child.mjs',import.meta.url),[root,scenario],
    {stdio:['ignore','ignore','inherit','ipc'],execArgv:[],windowsHide:true});
  const ended=once(proc,'exit');
  t.after(async()=>{if(proc.exitCode===null&&proc.signalCode===null){proc.kill('SIGKILL');await ended;}});
  const barrier=await new Promise((resolve,reject)=>{
    const deadline=setTimeout(()=>reject(new Error('RECOVERY_BARRIER_TIMEOUT')),30000);
    function finish(fn,value){clearTimeout(deadline);proc.off('message',arrived);proc.off('exit',exited);fn(value);}
    function arrived(message){finish(resolve,message);}
    function exited(){finish(reject,new Error('RECOVERY_CHILD_EXITED_EARLY'));}
    proc.once('message',arrived);proc.once('exit',exited);proc.once('error',reject);
  });
  assert.equal(barrier.status,'BARRIER');assert.equal(barrier.scenario,scenario);
  assert.equal(proc.kill('SIGKILL'),true);await ended;
  return barrier;
}
async function createState(t) {
  const root=await mkdtemp(join(tmpdir(),'saju-s9-recover-'));
  t.after(()=>rm(root,{force:true,recursive:true}));
  return root;
}
async function inventory(root) {
  const reports=join(root,'reports');
  const files=[];
  for(const owner of await readdir(reports))for(const name of await readdir(join(reports,owner)))files.push(join(reports,owner,name));
  return {final:files.filter(name=>name.endsWith('.json')),temporary:files.filter(name=>!name.endsWith('.json'))};
}

for(const scenario of ['refund-before-link','cancel-before-store','delete-before-unlink','crash-before-publish','crash-before-link']){
  test('S9 actual process termination and two restarts: '+scenario,async t=>{
    const root=await createState(t), {target,control}=await stopProcessAt(t,root,scenario);
    const before=await inventory(root),discard=['refund-before-link','cancel-before-store','delete-before-unlink'].includes(scenario);
    assert.equal(before.final.length,['cancel-before-store','crash-before-publish'].includes(scenario)?1:2);
    assert.equal(before.temporary.length,scenario==='crash-before-publish'?2:0);
    const frozen=new Map(await Promise.all(before.final.map(async file=>[file,await readFile(file)])));
    for(let restart=0;restart<2;restart++){
      const app=await openRecoveryApp(root);
      try {
        await app.service.drain();
        const state=await app.vault.read(),targetOrder=state.orders[target];
        assert.equal((await app.service.report(actors.control,control)).sections.sections.length,6);
        await assert.rejects(app.service.report(actors.control,target),/ORDER_NOT_FOUND/);
        await assert.rejects(app.service.deleteReport(actors.target,control),/ORDER_NOT_FOUND/);
        if(discard){
          assert.equal(targetOrder.accessStatus,'REVOKED');
          await assert.rejects(app.service.report(actors.target,target),/REPORT_ACCESS_UNAVAILABLE/);
          if(scenario==='delete-before-unlink')assert.equal((await app.service.deleteReport(actors.target,target)).status,'DELETED');
          else assert.equal((await app.service.command(actors.target,target,'REQUEST_REFUND')).refundStatus,'REQUESTED');
        } else {
          assert.equal(targetOrder.generationAttempts,2);
          assert.equal(targetOrder.generationStatus,'COMPLETED');
          assert.equal((await app.service.report(actors.target,target)).sections.sections.length,6);
        }
      } finally {await app.close();}
      const after=await inventory(root);
      assert.equal(after.final.length,discard?1:2);assert.deepEqual(after.temporary,[]);
      for(const file of after.final)if(frozen.has(file))assert.deepEqual(await readFile(file),frozen.get(file));
    }
  });
}

test('S9 unknown storage entry blocks startup without deleting it or serving a report',async t=>{
  const root=await createState(t),app=await openRecoveryApp(root);await app.close();
  const other=join(root,'reports','unknown.txt');
  await writeFile(other,'not a purchase report');
  await assert.rejects(openRecoveryApp(root),/REPORT_STORE_RECONCILIATION_REQUIRED/);
  assert.equal(await readFile(other,'utf8'),'not a purchase report');
});

test('S9 authenticated committed vault permits reclaiming an interrupted snapshot; wrong-key revoked data is retained for review',async t=>{
  const root=await createState(t);
  await stopProcessAt(t,root,'refund-before-link');
  const authoritative=await readFile(join(root,'vault','state.sealed.json'));
  const pending=join(root,'vault','.pending-'+'c'.repeat(32));
  await writeFile(pending,authoritative);
  const path=join(root,'keys','local-test-keys.json'),keys=JSON.parse(await readFile(path,'utf8'));
  keys.reportEncryptionKey=Buffer.alloc(32,42).toString('base64url');
  await writeFile(path,JSON.stringify(keys));
  await assert.rejects(openRecoveryApp(root),/REPORT_STORE_INTEGRITY_FAILED/);
  await assert.rejects(lstat(pending),{code:'ENOENT'});
  assert.equal((await inventory(root)).final.length,2);
});
