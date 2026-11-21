import {createHash} from 'node:crypto';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {resolve, join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {performance} from 'node:perf_hooks';
import {loadInterpretedReportService, validateIssuedInterpretedReport} from '../product/interpreted-report.mjs';
import {INTERPRETATION_PROFILE_ID, DOMAINS} from '../../dist/report/interpretationPolicyV1.js';
import {SPRINT7_REPORT_CASES, SPRINT7_REAL_DOMAIN_EXPECTATIONS} from '../../test/fixtures/sprint7-interpretation-cases-v1.mjs';

// This is an internal research instrument. Its entire input list is fictional and fixed.
export const MATERIALS_VERSION = 'S9-FICTIONAL-READINGS-V01';
const ids = index => 'F' + String(index + 1).padStart(2, '0');
const digest = value => createHash('sha256').update(value).digest('hex');
const unique = values => [...new Set(values)];
const check = (ok, code) => { if (!ok) throw new Error(code); };
const DOMAIN_NAMES = {BEHAVIOR:'행동',COMMUNICATION:'소통',WORK:'활동 방식',MONEY:'자원 선택'};

// Editorial controls. They describe no person and introduce no invented chart facts.
const GENERAL = Object.freeze({
  BEHAVIOR:'전통 해석에는 행동을 여러 관점에서 살펴보는 방법이 있습니다. 평소 익숙한 방식으로 결정한 일과 한 번 더 생각한 일을 떠올리고, 그때 중요하게 여긴 점이 무엇이었는지 돌아보세요.',
  COMMUNICATION:'사람들과 이야기할 때는 내 생각과 상대의 설명을 함께 살펴볼 수 있습니다. 최근 대화를 한 번 떠올려 보고, 내가 말한 것 가운데 상대가 어떻게 받아들였을지 궁금한 부분을 짚어 보세요.',
  WORK:'일을 시작할 때에는 먼저 해야 할 일과 나중에 해도 될 일을 정리해 볼 수 있습니다. 최근에 맡았던 일에서 어떤 단계를 먼저 살폈는지 돌아보세요.',
  MONEY:'자원을 쓸 때에는 사용할 수 있는 범위와 여러 선택을 함께 살펴볼 수 있습니다. 시간이나 비용을 나누어 썼던 일을 떠올리고 어떤 점을 중요하게 보았는지 돌아보세요.',
});

function candidateData(report) {
  const projection = report.basis.projection;
  const facts = new Map(projection.evidence.map(node => [node.id,node]));
  return projection.candidates.map(({id,ordinal,refs}) => {
    const get = kind => {
      const fact = facts.get(refs[kind]);
      check(fact && fact.candidateId === id,'S9_CANDIDATE_FACT_REFERENCE');
      return fact.value;
    };
    const chart = get('chart'), day = get('day'), pattern = get('pattern');
    return {ordinal, sourceId:id, pillars:chart.pillars.map(p => p.stem + p.branch), dayStem:day.stem,
      monthBranch:chart.pillars[1].branch, pattern:pattern.primaryPattern, patternStatus:pattern.status,
      exposures:pattern.exposures, unresolvedTypes:pattern.unresolvedTypes, seasons:get('seasonal').alternatives,
      m5:get('m5').status, m5Reasons:get('m5').reasonCodes};
  });
}

// A structural witness is identified by its actual locations within this candidate.
// Reversed pairs between WORK and MONEY and repeated summaries never add witnesses.
function witnessKey(condition, candidate) {
  const locations = condition.locations.map(l => [l.role,l.stem,l.tenGod].join('/')).sort().join('+');
  return condition.code.startsWith('MONTH_') ? 'month/' + candidate.monthBranch + '/' + locations : 'pair/' + locations;
}

export function describeQuality(fixture) {
  const parentResults = fixture.candidates.map(c => {
    const all = fixture.claims.filter(x => x.candidate === c.ordinal);
    const limited = all.filter(x => x.status === 'LIMITED');
    const uses = new Map();
    for (const claim of limited) for (const condition of claim.supportingConditions) {
      const key = witnessKey(condition,c);
      if (!uses.has(key)) uses.set(key,new Set());
      uses.get(key).add(claim.domain);
    }
    const symbolicChapters = unique(limited.map(x => x.domain === 'BEHAVIOR' ? 3 : 4)).sort();
    return {candidate:c.ordinal, limitedClaims:limited.length, heldClaims:all.filter(x=>x.status==='HOLD').length,
      newSymbolicChapters:symbolicChapters, heldSymbolicChapters:[3,4].filter(n=>!symbolicChapters.includes(n)),
      distinctStructuralWitnesses:uses.size, repeatedRolePairs:[...uses].filter(([k,d])=>k.startsWith('pair/')&&d.size>1).map(([key,domains])=>({key,domains:[...domains]}))};
  });
  return {parentResults,chapterStatus:fixture.chapters.map(x=>({chapterId:x.chapterId,status:x.status})),
    newSymbolicChapters:unique(parentResults.flatMap(x=>x.newSymbolicChapters)).sort(),
    evidenceUnit:'Distinct observed location tuples per natal candidate; no independence of effects is implied.'};
}

// Compact aliases are scoped to the fixture and always retain the issuer's candidate
// and claim identifiers for expert review. Reader endpoints use an explicit projection.
export function toStudyFixture(report, fixtureId) {
  const projection = report.basis.projection;
  const candidates = candidateData(report);
  const facts = new Map(projection.evidence.map(e => [e.id,e]));
  const claims = report.interpretationClaims.map(claim => {
    const c = candidates.find(x=>x.sourceId === claim.chartCandidateRef);
    check(c,'S9_CANDIDATE_CLAIM_REFERENCE');
    const inputFacts = claim.inputFactRefs.map(ref=>{
      const fact = facts.get(ref);
      check(fact && fact.candidateId===c.sourceId,'S9_CLAIM_FACT_REFERENCE');
      return {ref, layer:fact.layer, value:fact.value, policyId:fact.policyId, policyVersion:fact.policyVersion};
    });
    return {claimId:'p'+c.ordinal+'-'+claim.domain.toLowerCase(), originalRef:claim.claimId,
      candidate:c.ordinal, domain:claim.domain, status:claim.confidenceOrApplicabilityStatus, text:claim.consumerText,
      inputFacts, supportingConditions:claim.supportingConditions, competingConditions:claim.competingConditions,
      policy:{id:claim.interpretationPolicyId, version:claim.interpretationPolicyVersion}, decision:claim.decisionCode,
      sourceRefs:claim.sourceRefs, unresolvedEffects:claim.unresolvedEffects, forbiddenConclusions:claim.forbiddenConclusions};
  });
  const chapters = report.sections.map(s=>({chapterId:'ch'+s.chapter,title:s.title,status:s.status,
    paragraphs:s.blocks.map(b=>b.text)}));
  const chartSummary = candidates.map(c=>'후보 '+c.ordinal+' · '+c.pillars.join(' · ')).join('\n') ||
    report.opening.map(b=>b.text).join('\n');
  return {id:fixtureId, label:'가상 명식 '+fixtureId.slice(1), status:projection.calculationStatus,
    artifactVersion:report.provenance.artifactVersion, chartSummary, candidates, opening:report.opening.map(x=>x.text),
    chapters, claims, eligibility:report.eligibility.status, sources:report.provenance.interpretationSources,
    blockers:projection.blockers, dialect:'ko-KR'};
}

// Existing text only, with explicit identifiers/locator sentence masked equally in A and C.
// Multiple paragraphs can contain qualifications: do not excerpt those claims.
function blindExcerpt(claim) {
  if (claim.status !== 'LIMITED' || claim.text.includes('\n')) return null;
  const cut = claim.text.indexOf('. ');
  if (cut < 0) return null;
  const body = claim.text.slice(cut + 2);
  if (!body || /[\u3400-\u9fff]|일과 활동에서 읽은 같은/.test(body)) return null;
  return body;
}

function comparison(fixtures, fixtureId) {
  const pos = fixtures.findIndex(f=>f.id === fixtureId);
  check(pos >= 0,'S9_UNKNOWN_FIXTURE');
  const own = fixtures[pos];
  if (own.candidates.length !== 1) return null;
  // Fixed rotation prevents the first listed domain or foil from owning every trial.
  for (let k=0; k<DOMAINS.length; k++) {
    const domain = DOMAINS[(pos+k)%DOMAINS.length];
    const target = own.claims.find(c=>c.domain === domain);
    const a = target && blindExcerpt(target);
    if (!a) continue;
    for (let i=1; i<fixtures.length; i++) {
      const foil = fixtures[(pos+i)%fixtures.length];
      if (foil.candidates.length!==1 || foil.candidates[0].pillars.join()===own.candidates[0].pillars.join()) continue;
      const other = foil.claims.find(c=>c.domain===domain);
      const c = other && blindExcerpt(other);
      if (!c || c===a) continue;
      const lengths = [a,GENERAL[domain],c].map(s=>Array.from(s).length);
      if (Math.max(...lengths)>Math.min(...lengths)*1.7) continue;
      // Every fourth catalogue position is eligible for an identical-wording control.
      // Only do this inside an already matchable stratum; keep the original denominator.
      if (pos % 4 === 1) {
        const repeated = fixtures.find(f=>f.candidates.length===1 &&
          f.candidates[0].pillars.join()!==own.candidates[0].pillars.join() &&
          f.claims.some(row=>row.domain===domain && blindExcerpt(row)===a));
        if (repeated) {
          const repeatedClaim=repeated.claims.find(row=>row.domain===domain);
          return {domain,texts:{A:a,B:GENERAL[domain],C:blindExcerpt(repeatedClaim)},foil:repeated.id,
            targetClaim:target.claimId,foilClaim:repeatedClaim.claimId,stratum:'IDENTICAL_WORDING_DIFFERENT_CHART'};
        }
      }
      return {domain,texts:{A:a,B:GENERAL[domain],C:c},foil:foil.id,targetClaim:target.claimId,
        foilClaim:other.claimId,stratum:'DISTINCT_WORDING_DIFFERENT_CHART'};
    }
  }
  return null;
}

function validateOrder(order) {
  check(Array.isArray(order)&&order.length===3&&['A','B','C'].every(x=>order.includes(x)),'S9_BLIND_ORDER');
}
// Operator-only stratification. This value must not be sent with blinded participant packets.
export function getComparisonType(fixtures,fixtureId) {
  return comparison(fixtures,fixtureId)?.stratum ?? null;
}
export function getBlindPacket(fixtures,id,order) {
  validateOrder(order);
  const trial = comparison(fixtures,id);
  if (!trial) return null;
  const own = fixtures.find(f=>f.id===id);
  const base = own.chapters.find(c=>c.chapterId==='ch2')?.paragraphs?.[0] || '';
  return {fixtureId:id, topic:DOMAIN_NAMES[trial.domain], context:own.chartSummary+'\n'+base,
    readings:order.map((kind,i)=>({slot:String(i+1),text:trial.texts[kind]}))};
}
export function getBlindDebrief(fixtures,id,order) {
  validateOrder(order);
  const trial = comparison(fixtures,id);
  if (!trial) return null;
  const labels={A:'이 가상 명식에서 생성한 해석',B:'연구용으로 작성한 일반 설명',C:'다른 가상 명식에서 생성한 해석'};
  const repeated = trial.stratum==='IDENTICAL_WORDING_DIFFERENT_CHART' ? ' 두 원국에서 같은 해석 문장이 나왔습니다. 이 비교에서 두 글을 내용으로 구별할 수는 없습니다.' : '';
  return {fixtureId:id,readings:order.map((kind,i)=>({slot:String(i+1),origin:labels[kind]})),
    explanation:'세 글은 같은 주제에서 뽑았습니다. 두 명식의 해석문에서는 위치를 직접 알려 주는 첫 문장을 가렸습니다.'+repeated+' 답을 고른 이유와 실제 구매 의향은 따로 살핍니다.'};
}

function checkContract(source, fixture) {
  check(source.expected.status===fixture.status&&source.expected.natalParents===fixture.candidates.length,'S9_S7_CASE_STATUS');
  const statuses=fixture.candidates.map(c=>fixture.claims.filter(x=>x.candidate===c.ordinal).map(x=>x.status));
  check(JSON.stringify(statuses)===JSON.stringify(SPRINT7_REAL_DOMAIN_EXPECTATIONS[source.id]),'S9_S7_DOMAIN_REGRESSION');
  if (source.expected.pillars) check(JSON.stringify(source.expected.pillars)===JSON.stringify(fixture.candidates.map(c=>c.pillars)),'S9_S7_PILLAR_REGRESSION');
}

export function summarizeStudy(fixtures) {
  const candidates=fixtures.flatMap(f=>f.candidates);
  const byFixture=fixtures.map(f=>({id:f.id,...describeQuality(f)}));
  const rows=byFixture.flatMap(f=>f.parentResults);
  const claims=fixtures.flatMap(f=>f.claims);
  const blindTrials=fixtures.flatMap(f=>{
    const trial=comparison(fixtures,f.id);
    return trial ? [{target:f.id,foil:trial.foil,domain:trial.domain,stratum:trial.stratum,targetClaim:trial.targetClaim,foilClaim:trial.foilClaim}] : [];
  });
  const blindEligible=blindTrials.map(t=>t.target);
  const uniquePillars=unique(candidates.map(c=>c.pillars.join(' ')));
  return {fictionalInputs:fixtures.length, distinctCharts:uniquePillars.length, natalCandidates:candidates.length,
    computedInputs:fixtures.filter(f=>f.candidates.length>0).length,
    dayStems:unique(candidates.map(c=>c.dayStem)),monthBranches:unique(candidates.map(c=>c.monthBranch)),
    patterns:unique(candidates.map(c=>c.pattern).filter(Boolean)),
    domains:Object.fromEntries(DOMAINS.map(d=>[d,Object.fromEntries(['LIMITED','HOLD','SUPPORTED'].map(s=>[s,claims.filter(c=>c.domain===d&&c.status===s).length]))])),
    chaptersWithNewSymbolicReading:Object.fromEntries([0,1,2].map(n=>[n,rows.filter(r=>r.newSymbolicChapters.length===n).length])),
    parentsWithRepeatedPairs:rows.filter(r=>r.repeatedRolePairs.length).length,
    distinctWitnessesAcrossCandidateRows:rows.reduce((n,r)=>n+r.distinctStructuralWitnesses,0),
    blindEligible, blindTrials, byFixture};
}

export async function buildStudyMaterials({dataDirectory}) {
  const init = performance.now();
  const service=await loadInterpretedReportService({dataDirectory,profileId:INTERPRETATION_PROFILE_ID});
  const engineLoadMs=performance.now()-init;
  const fixtures=[], operations=[];
  for (const [i,studyCase] of SPRINT7_REPORT_CASES.entries()) {
    const t=performance.now(),cpu=process.cpuUsage();
    const report=service.calculate(studyCase.request);
    validateIssuedInterpretedReport(report);
    const cpuUsed=process.cpuUsage(cpu),elapsed=performance.now()-t;
    const fixture=toStudyFixture(report,ids(i));
    fixture.fictionalInput = structuredClone(studyCase.request);
    fixture.dataVersion = report.provenance.dataVersion;
    fixture.generatorVersion = report.provenance.generatorVersion;
    fixture.basisVersion = report.provenance.interpretationResolverVersion;
    checkContract(studyCase,fixture);
    fixtures.push(fixture);
    operations.push({id:fixture.id,status:fixture.status,eligibility:fixture.eligibility,
      generationAndValidationMs:Math.round(elapsed*10)/10,cpuMs:(cpuUsed.user+cpuUsed.system)/1000,
      qaStatus:report.qa.status, fallback:report.generation.fallbackUsed,regenerations:report.generation.attemptCount});
  }
  const diagnostics=summarizeStudy(fixtures);
  return {version:MATERIALS_VERSION,fixtures,diagnostics,
    operations:{engineLoadMs:Math.round(engineLoadMs),rows:operations}};
}

async function cli(args) {
  check(process.versions.node.split('.')[0]==='22','S9_NODE_22_REQUIRED');
  check(args.length===4&&args[0]==='--data-pack'&&args[2]==='--out','S9_MATERIAL_ARGUMENTS');
  const out = resolve(args[3]);
  const study = await buildStudyMaterials({dataDirectory:resolve(args[1])});
  const material = JSON.stringify({version:study.version,fixtures:study.fixtures,diagnostics:study.diagnostics});
  const meaningSha256=digest(material);
  // An operator chooses a NEW private directory. Do not overwrite a previous run.
  await mkdir(out,{mode:0o700});
  await writeFile(join(out,'materials.json'),material,{flag:'wx',mode:0o600});
  check(digest(await readFile(join(out,'materials.json')))===meaningSha256,'S9_MATERIAL_READBACK');
  const receipt={schema:'s9-study-run-v1',timeZone:Intl.DateTimeFormat().resolvedOptions().timeZone,
    node:process.version,meaningSha256,materialBytes:Buffer.byteLength(material),...study.operations,
    diagnostics:study.diagnostics,fixtureMap:SPRINT7_REPORT_CASES.map((c,i)=>({id:ids(i),sourceCase:c.id})),
    expertParticipants:0,readerParticipants:0};
  await writeFile(join(out,'receipt.json'),JSON.stringify(receipt,null,2),{flag:'wx',mode:0o600});
  process.stdout.write(JSON.stringify({status:'BUILT',fictionalInputs:study.fixtures.length,meaningSha256,materialBytes:receipt.materialBytes})+'\n');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href) {
  cli(process.argv.slice(2)).catch(error=>{process.stderr.write((/^[A-Z0-9_]+$/.test(error.message)?error.message:'S9_MATERIAL_BUILD_FAILED')+'\n');process.exitCode=1;});
}
