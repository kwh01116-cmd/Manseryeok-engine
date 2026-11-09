import test from 'node:test';
import assert from 'node:assert/strict';
import { allowedSmokeRequest } from '../scripts/browser-request-policy.mjs';
const origin='http://127.0.0.1:12345';
test('browser smoke permits its exact loopback origin and rejects external/prefix-confused network requests',()=>{
  assert.equal(allowedSmokeRequest({url:origin+'/api/preview'},origin),true);
  for(const url of ['https://example.com/telemetry',origin+'.evil.test/a','http://127.0.0.1:12346/api','http://localhost:12345/', 'file:///tmp/a','chrome://settings/', 'blob:'+origin+'/a']) assert.equal(allowedSmokeRequest({url},origin),false,url);
});
test('inline resource check rejects arbitrary SVG, HTML, script, remote-image and forged native-clock metadata',()=>{
  const resource={type:'Image',initiator:{type:'parser',url:origin+'/'}};
  for(const url of ['data:image/svg+xml;base64,'+Buffer.from('<svg/>').toString('base64'),'data:text/html,<script>1</script>','data:image/png;base64,AAAA','javascript:1','https://example.com/time.svg']) assert.equal(allowedSmokeRequest({...resource,url},origin),false);
  assert.equal(allowedSmokeRequest({...resource,url:'data:image/svg+xml;base64,'+'A'.repeat(2000)},origin),false);
});
