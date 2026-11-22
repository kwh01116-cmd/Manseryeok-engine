/** Run the pinned package outside the checkout with Node-only dependency guards. */
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { appendFile, cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { promisify } from 'node:util';
import { writeOfflineGuards } from '../offline/guards.mjs';
import { createNewDirectory, digest, filesBelow, hashFiles, parsePairs, pathsOverlap } from '../offline/integrity.mjs';
import { verifyE5Package } from './e5-package.mjs';
import { E2_OFFLINE_CASES } from '../../test/fixtures/e2-offline-cases-v1.mjs';

const execute = promisify(execFile);
const repo = resolve(import.meta.dirname, '../..');
const samplePath = 'docs/contracts/examples/engine-e5-request-v1.json';
const save = (path, value) => writeFile(path, JSON.stringify(value, null, 2) + '\n', { flag: 'wx' });

async function prepareGuards(dir) {
  const { loader, preload } = await writeOfflineGuards(dir, { forbiddenRoot: repo });
  const scope = join(dir, 'deny-source-reads.mjs'), restore = join(dir, 'restore-guard.mjs');
  await writeFile(scope, [
    "import fs from 'node:fs'; import fsp from 'node:fs/promises';",
    "import {relative,resolve,isAbsolute} from 'node:path'; import {fileURLToPath} from 'node:url';",
    "import {syncBuiltinESMExports} from 'node:module';",
    "const root=" + JSON.stringify(repo) + ";",
    "function check(path) {",
    "  if(typeof path==='number') return;",
    "  if(path instanceof URL && path.protocol==='file:') path=fileURLToPath(path);",
    "  const rel=relative(root,resolve(String(path)));",
    "  if(!isAbsolute(rel) && rel.split(/[\\\\/]/)[0]!=='..') throw Error('E5_DEVELOPER_FILE_READ_DENIED');",
    "}",
    "for(const name of ['readFile','createReadStream','readdir','open','lstat','stat','realpath','access']) {",
    "  for(const [obj,key] of [[fs,name],[fs,name+'Sync'],[fsp,name]]) {",
    "    const original=obj[key]; if(typeof original==='function')",
    "      obj[key]=function(path,...args){check(path);return original.call(this,path,...args);};",
    "  }",
    "}",
    "syncBuiltinESMExports();",
  ].join('\n'), { flag: 'wx' });
  await writeFile(restore, [
    "import net from 'node:net'; import http from 'node:http'; import https from 'node:https';",
    "import {register,syncBuiltinESMExports} from 'node:module';",
    "const deny=()=>{throw Error('OFFLINE_NETWORK_DENIED');};",
    "globalThis.fetch=deny; net.Socket.prototype.connect=deny; net.Server.prototype.listen=deny;",
    "http.request=deny; http.get=deny; https.request=deny; https.get=deny;",
    "process.env=new Proxy(process.env,{get(t,key){",
    "  if(typeof key==='string'&&/KASI|API_KEY|SERVICE_KEY/i.test(key)) throw Error('OFFLINE_KEY_ACCESS_DENIED');",
    "  return Reflect.get(t,key);",
    "}});",
    "syncBuiltinESMExports(); register(" + JSON.stringify(pathToFileURL(loader).href) + ");",
  ].join('\n'), { flag: 'wx' });
  return { scope, preload, restore };
}

function verifyOutput(value, expected, status) {
  assert.equal(value.status, status);
  assert.equal(value.candidates.length, expected);
  assert.equal(value.e3.candidates.length, expected);
  const pointer = ref => ref.split('/').slice(1).reduce((item, name) => item?.[name], value);
  if (!expected) {
    assert.equal(Object.keys(value.unavailableFeatures).length, 4);
    for (const feature of Object.values(value.unavailableFeatures)) {
      assert.equal(feature.result, null);
      feature.factRefs.forEach(ref => assert.notEqual(pointer(ref), undefined, ref));
    }
  }
  for (const [index, parent] of value.candidates.entries()) {
    assert.equal(parent.candidateRef, value.e3.candidates[index].candidateRef);
    assert.equal(parent.candidateRef, value.e3.e2.candidates[index].candidateRef);
    assert.equal(Object.keys(parent.features).length, 4);
    for (const feature of Object.values(parent.features)) {
      assert.equal(feature.result.candidateRef, parent.candidateRef);
      feature.factRefs.forEach(ref => assert.notEqual(pointer(ref), undefined, ref));
    }
  }
}

function semantics(value) {
  return value.candidates.map(parent => {
    const { patternAssessmentV2, climateAssessmentV2, tongguanAssessment, purposeComparison } = parent.features;
    return {
      rules: patternAssessmentV2.result.rules.map(r => [r.ruleId, r.patternType, r.previousStatus, r.status, r.comparison]),
      climate: [climateAssessmentV2.result.status, climateAssessmentV2.result.family,
        climateAssessmentV2.result.candidates.map(c => [c.stem, c.element])],
      tongguan: [tongguanAssessment.result.status, tongguanAssessment.result.routes.map(r => [
        r.from, r.mediator, r.to, r.status, r.paths.length,
      ])],
      purpose: purposeComparison.result.relations.map(r => [r.left, r.right, r.status]),
    };
  });
}

export async function verifyDetachedE5({ artifact, pin, dataPack, out, legacyExample }) {
  assert.ok(![artifact, dataPack, repo].some(path => pathsOverlap(path, out)));
  const manifest = await verifyE5Package(artifact, pin);
  assert.equal(manifest.buildMode, 'FIXED_SOURCE_REVISION');
  const dir = await createNewDirectory(out, { privateOnly: true });
  const delivery = join(dir, 'input-code'), received = join(dir, 'input-data');
  const engine = join(dir, 'engine'), data = join(dir, 'server-data');
  const results = join(dir, 'results'), requests = join(dir, 'requests');
  const processes = [];
  try {
    await cp(artifact, delivery, { recursive: true });
    await cp(dataPack, received, { recursive: true });
    await mkdir(results); await mkdir(requests);
    const guards = await prepareGuards(dir);
    async function run(label, file, args, { tz = 'UTC', code = 0, stderr, writable = false } = {}) {
      const env = { PATH: '', TZ: tz };
      for (const key of ['SystemRoot', 'WINDIR', 'TEMP', 'TMP']) if (process.env[key]) env[key] = process.env[key];
      const flags = [guards.scope, writable ? guards.restore : guards.preload]
        .flatMap(path => ['--import', pathToFileURL(path).href]);
      let output, errorOutput, actualCode;
      try {
        ({ stdout: output, stderr: errorOutput } = await execute(process.execPath, [...flags, file, ...args], {
          cwd: dir, env, windowsHide: true, timeout: 180000, maxBuffer: 16 * 1024 * 1024,
        }));
        actualCode = 0;
      } catch (failure) {
        output = failure.stdout ?? ''; errorOutput = failure.stderr ?? ''; actualCode = failure.code;
      }
      processes.push({ label, tz, exitCode: actualCode, sha256: digest(output), stderr: errorOutput.trim() });
      assert.equal(actualCode, code, label + ': ' + errorOutput.trim());
      if (stderr) assert.match(errorOutput, stderr, label);
      else assert.equal(errorOutput, '', label);
      return output;
    }

    const probe = join(dir, 'guard-probe.mjs');
    await writeFile(probe, [
      "import assert from 'node:assert/strict';",
      "import {readFile} from 'node:fs/promises';",
      "assert.equal(process.env.PATH,'');",
      "assert.throws(()=>process.env.KASI_SERVICE_KEY,/OFFLINE_KEY_ACCESS_DENIED/);",
      "assert.throws(()=>fetch('https://example.invalid'),/OFFLINE_NETWORK_DENIED/);",
      "await assert.rejects(import('node:child_process'),/OFFLINE_NETWORK_OR_PROCESS_IMPORT_DENIED/);",
      "await assert.rejects(import(" + JSON.stringify(pathToFileURL(join(repo, 'scripts/engine/e5.mjs')).href) +
        "),/OFFLINE_DEVELOPER_PATH_DENIED/);",
      "assert.throws(()=>readFile(" + JSON.stringify(join(repo, 'package.json')) + "),/E5_DEVELOPER_FILE_READ_DENIED/);",
    ].join('\n'), { flag: 'wx' });
    await run('BOUNDARY_GUARDS', probe, []);
    await run('RESTORE', join(delivery, 'engine.mjs'), ['restore', '--manifest-sha', pin, '--out', engine,
      '--data-pack', received, '--data-out', data], { writable: true });

    const bootstrap = join(engine, 'engine.mjs'), example = join(engine, samplePath);
    const runArgs = (request, pack = data) => ['run', '--manifest-sha', pin, '--request', request, '--data-pack', pack];
    const request = JSON.parse(await readFile(example, 'utf8'));
    const baseBytes = await run('E5_EXAMPLE', bootstrap, runArgs(example));
    const base = JSON.parse(baseBytes);
    verifyOutput(base, 1, base.status);
    assert.deepEqual(base.e3, JSON.parse(await readFile(legacyExample, 'utf8')));
    await writeFile(join(results, 'E5_EXAMPLE.json'), baseBytes, { flag: 'wx' });
    assert.equal(await run('E5_EXAMPLE_SEOUL', bootstrap, runArgs(example), { tz: 'Asia/Seoul' }), baseBytes);

    const cases = [
      ...E2_OFFLINE_CASES.slice(0, 15),
      { id: 'SUMMER_JIA_CANDIDATE', birth: { ...E2_OFFLINE_CASES[0].birth, date: '1998-05-07', time: '04:15' }, climate: 'WATER' },
      { id: 'WINTER_GENG_CANDIDATE', birth: { ...E2_OFFLINE_CASES[0].birth, date: '1992-12-10', time: '18:15' }, climate: 'FIRE' },
    ];
    let leap;
    for (const { id, birth, expected, climate } of cases) {
      const path = join(requests, id + '.json');
      await save(path, { ...request, birth });
      const bytes = await run(id, bootstrap, runArgs(path), { code: expected?.natalParents === 0 ? 2 : 0 });
      const actual = JSON.parse(bytes);
      verifyOutput(actual, expected?.natalParents ?? 1, expected?.status ?? actual.status);
      if (climate) assert.equal(actual.candidates[0].features.climateAssessmentV2.result.candidates[0]?.element, climate);
      if (id === 'LICHUN_CORRELATED_NATAL_PARENTS') {
        assert.notEqual(actual.candidates[0].candidateRef, actual.candidates[1].candidateRef);
        assert.equal(await run('LICHUN_SEOUL', bootstrap, runArgs(path), { tz: 'Asia/Seoul' }), bytes);
      }
      if (id === 'DERIVED_EARTH_SEASON_BOUNDARY') {
        assert.equal(actual.candidates[0].features.climateAssessmentV2.result.seasonal.alternativeConditions.length, 2);
      }
      if (id === 'LEAP_GREGORIAN') leap = semantics(actual);
      if (id === 'LEAP_LUNAR') assert.deepEqual(semantics(actual), leap);
      await writeFile(join(results, id + '.json'), bytes, { flag: 'wx' });
    }

    const core = structuredClone(request);
    delete core.selection.e3.e2.e1;
    const corePath = join(requests, 'NO_E1.json');
    await save(corePath, core);
    const coreResult = JSON.parse(await run('NO_E1', bootstrap, runArgs(corePath)));
    assert.equal(coreResult.candidates[0].features.purposeComparison.result.assessments.EOKBU.status, 'NOT_SELECTED');
    assert.deepEqual(coreResult.candidates[0].features.tongguanAssessment.result, base.candidates[0].features.tongguanAssessment.result);

    const badPolicy = structuredClone(request); badPolicy.selection.climate.policyVersion = '9';
    const badPolicyPath = join(requests, 'INVALID_POLICY.json'), foreignPath = join(requests, 'FOREIGN_CANDIDATE.json');
    await save(badPolicyPath, badPolicy);
    await save(foreignPath, { ...request, candidates: base.candidates });
    await run('INVALID_POLICY', bootstrap, runArgs(badPolicyPath), { code: 1, stderr: /E5_EXPLICIT_POLICY_VERSION_REQUIRED/ });
    await run('FOREIGN_CANDIDATE', bootstrap, runArgs(foreignPath), { code: 1, stderr: /E5_REQUEST_SCHEMA/ });

    const copiedData = join(dir, 'tamper-data');
    await cp(data, copiedData, { recursive: true });
    await appendFile(join(copiedData, 'NOTICE.txt'), '\n');
    await run('DATA_CHANGED', bootstrap, runArgs(example, copiedData), { code: 1, stderr: /API_ONLY_FILE_CHANGED/ });
    const copiedEngine = join(dir, 'tamper-engine');
    await cp(engine, copiedEngine, { recursive: true });
    const tamperEntry = join(copiedEngine, 'engine.mjs');
    await appendFile(join(copiedEngine, 'dist/e5/patternV2.js'), '\nthrow Error("unverified runtime");\n');
    await run('MODULE_CHANGED', tamperEntry, runArgs(example), { code: 1, stderr: /E1_ARTIFACT_FILE_SET_OR_BYTES_CHANGED/ });
    await appendFile(join(copiedEngine, 'engine-manifest.json'), ' ');
    await run('MANIFEST_CHANGED', tamperEntry, runArgs(example), { code: 1, stderr: /E5_MANIFEST_PIN_MISMATCH/ });

    assert.deepEqual(await hashFiles(data, await filesBelow(data)), await hashFiles(dataPack, await filesBelow(dataPack)));
    const result = {
      status: 'PASS', node: process.version, sourceRevision: manifest.sourceRevision,
      pin, e3ManifestSha256: manifest.e3ManifestSha256, dataPackSha256: manifest.acceptedDataPackSha256,
      files: manifest.files.length, comparison: 'E3_NESTED_EXACTLY_MATCHES_PRIOR_STANDALONE_EXPORT',
      packageExampleSha256: digest(baseBytes), leapSemanticsSha256: digest(JSON.stringify(leap)),
      restoredDataBytesEqual: true, processes,
    };
    await save(join(dir, 'receipt.json'), result);
    return result;
  } catch (error) {
    await save(join(dir, 'failure.json'), { sourceRevision: manifest.sourceRevision, pin, processes, error: error.message });
    throw error;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const options = parsePairs(process.argv.slice(2), ['--artifact', '--manifest-sha', '--data-pack', '--out', '--legacy-example']);
  const result = await verifyDetachedE5({ artifact: options['--artifact'], pin: options['--manifest-sha'],
    dataPack: options['--data-pack'], out: options['--out'], legacyExample: options['--legacy-example'] });
  console.log(JSON.stringify({ status: result.status, processes: result.processes.length, pin: result.pin }));
}
