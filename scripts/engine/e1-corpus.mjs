/** Internal replay from fixed fictional birth dates; never accepts real customer input. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {join, resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {loadEngineE1, E1_SELECTION} from './e1.mjs';
import {GRID_PATH, supportSignature} from './select-e1-cohort.mjs';
import {SERVER_REQUEST_LITERAL_BASE} from '../../test/fixtures/server-api-only-request-cases-v1.mjs';
import {SPRINT6_REPORT_CASES} from '../../test/fixtures/sprint6-report-cases-v1.mjs';
import {WEIGHTED_SUPPORT_POLICY_ID} from '../../dist/experimental/weightedSupportV1.js';
import {STEM_NATURE} from '../../dist/domain/stems.js';
import {HIDDEN_STEMS_V1} from '../../dist/domain/hiddenStems.js';
import {fiveElementRelation} from '../../dist/domain/tenGods.js';

const inputPath = new URL('../../test/fixtures/oss-audit-100-cases.json',import.meta.url);
const normalize = bytes => bytes.toString().replaceAll('\r\n','\n');
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const tally = xs => xs.reduce((counts,x) => {counts[x]=(counts[x]??0)+1;return counts;},{});
const sum = xs => xs.reduce((a,b)=>a+b,0);
const readRows = async (path, expectedHash) => {
  const bytes=await readFile(path);
  assert.equal(digest(bytes),expectedHash,'archived receipt differs: '+path);
  return bytes.toString().trim().split(/\r?\n/).map(line=>JSON.parse(line));
};
const request=(date,time,options={})=>({...SERVER_REQUEST_LITERAL_BASE,date,time,...options});

function projectCandidate(c) {
  const s=c.strengthAssessment, e=c.eokbuCandidate;
  assert.equal(s.candidateRef,e.candidateRef);
  assert.equal(s.candidateRef,c.candidateRef);
  assert.equal(sum(Object.values(s.roleUnits)),10000);
  assert.equal(new Set(s.weightedComponents.map(l=>l.factRef)).size,s.weightedComponents.length);
  assert.equal(s.rootEvidence.extraRootUnits,0);
  const signedEvidence = (s.grade==='WEAK' ? s.supportingEvidence.largestSupportRefs :
    s.opposingEvidence.largestOppositionRefs).map(ref => {
      const loc=s.weightedComponents.find(l=>l.factRef===ref);
      assert.ok(loc);
      return [loc.role,loc.kind,loc.stem,loc.family,loc.units/100];
    });
  return {ref:c.candidateRef,pillars:c.pillars.map(p=>p.stem+p.branch),signature:supportSignature(c.pillars),
    cell:c.pillars[2].stem+c.pillars[1].branch,status:s.status,grade:s.grade,score:s.score.supportUnits/100,
    acquired:[s.seasonalEvidence.acquired,s.rootEvidence.acquired,s.supportingEvidence.acquired],
    roleUnits:s.roleUnits,special:s.specialReview,sensitivity:s.sensitivity.status,
    changedProbes:s.sensitivity.probes.filter(p=>p.grade!==s.grade).map(p=>p.id),
    mainOnlyChanged:s.sensitivity.stressOnly.grade!==s.grade,opposing:signedEvidence,
    pattern:c.pattern.selection.primaryPattern,patternStatus:c.pattern.selection.status,
    patternCandidates:c.pattern.selection.candidateTypes,unresolvedPattern:c.pattern.selection.unresolvedTypes,
    rank:e.status,leaders:e.candidates.map(p=>({family:p.family,element:p.element})),
    alternatives:e.alternatives.filter(p=>p.presence!=='ABSENT').map(p=>p.family),causes:e.causes.map(p=>p.family),
    candidateSensitivity:e.candidateSensitivity.status,
    changedCandidateThresholds:e.candidateSensitivity.probes.filter(p=>p.changesLeaderSet).map(p=>p.toleranceUnits),
    e2CounterDirections:e.patternHandoff.directions.filter(d=>d.potentialCounterDirection).length,
    held:e.holdReasons,climate:e.climateComparison.status,climateSource:c.climate.status,
    seasonVariants:c.climate.inputFacts?.seasonalAlternatives?.length??null};
}

function calculate(engine, input, id) {
  const e1=engine.calculate(input,E1_SELECTION);
  const parents=e1.candidates.map(projectCandidate);
  assert.equal(parents.length,e1.existing.candidates.length);
  return {id,date:input.date??input.lunarDate,time:input.time,calendar:input.calendar,status:e1.status,parents,
    oldWeights:e1.existing.analysisData?.base?.weighted??null};
}

/** Local reconstruction of the three published 8-codes definitions only.
 * Assumptions: classify each branch by our principal stem; exclude the day
 * master from the five remaining positions. No proprietary weighting or ranking. */
export function publicDefinitionFlags(pillars) {
  const [year,month,day,hour]=pillars;
  const dayElement=STEM_NATURE[day[0]].element;
  const supportive=stem=>['SAME','TARGET_GENERATES_DAY_MASTER'].includes(fiveElementRelation(dayElement,STEM_NATURE[stem].element));
  const main=p=>HIDDEN_STEMS_V1[p[1]][0].stem;
  const positions=[year[0],month[0],hour[0],main(year),main(hour)];
  return [supportive(main(month)),supportive(main(day)),positions.filter(supportive).length>=2];
}

export function gridSummary(rows) {
  const charts=rows.flatMap(r=>r.parents);
  const ordinary=charts.filter(p=>!p.special);
  const signatures=charts.map(p=>p.signature.split('/'));
  const flagMatches=charts.map(c=>publicDefinitionFlags(c.pillars).map((v,i)=>v===c.acquired[i]));
  const measure=cs=>({denominator:cs.length,grades:tally(cs.map(c=>c.grade)),rank:tally(cs.map(c=>c.rank)),
    holds:tally(cs.flatMap(c=>c.held)),sensitivity:tally(cs.map(c=>c.sensitivity)),climateRelation:tally(cs.map(c=>c.climate)),
    causeTolerance:tally(cs.map(c=>c.candidateSensitivity)),changedCandidateThresholds:tally(cs.flatMap(c=>c.changedCandidateThresholds)),
    potentialE2CounterDirection:cs.filter(c=>c.e2CounterDirections>0).length});
  return {inputs:rows.length,complete:charts.length,uniquePillars:new Set(charts.map(p=>p.pillars.join(''))).size,
    calendarCells:new Set(charts.map(p=>p.cell)).size,all:measure(charts),ordinary:measure(ordinary),
    distinctPrimaryPatterns:tally(charts.map(p=>p.pattern??'PEER_MAIN')),m4Selection:tally(charts.map(p=>p.patternStatus)),
    exactRoot:signatures.filter(([r])=>r.includes('E')).length,
    noElementRoot:signatures.filter(([r])=>r==='----').length,
    otherElementRootOnly:signatures.filter(([r])=>r.includes('S')&&!r.includes('E')).length,
    visiblePeer:signatures.filter(([,s])=>s.includes('P')).length,visibleResource:signatures.filter(([,s])=>s.includes('R')).length,
    noVisibleSupport:signatures.filter(([,s])=>s==='---').length,
    causes:tally(charts.flatMap(p=>p.causes)),mixedSupportAndOpposition:charts.filter(p=>p.score>0&&p.score<100).length,
    threshold45or55:charts.filter(p=>[45,55].includes(p.score)).length,
    changedUnderLocalProbe:tally(charts.flatMap(p=>p.changedProbes)),mainOnlyGradeChanges:charts.filter(p=>p.mainOnlyChanged).length,
    publishedDefinitionReconstruction:{sameByFlag:[0,1,2].map(i=>flagMatches.filter(row=>row[i]).length),
      allThreeSame:flagMatches.filter(flags=>flags.every(Boolean)).length,denominator:charts.length,commercialAppRuns:0}};
}

async function grid(engine) {
  const text=normalize(await readFile(GRID_PATH));
  assert.equal(digest(text),'01c18fe2cecfd304afd507fba0247978a6fcbc73f4a79b1ff5fd425d97264f60','preselected fixture changed');
  const rows=[];
  for(const [i,line] of text.trim().split('\n').entries()){
    const [date,time,cell,signature]=line.split(' ');
    const row=calculate(engine,request(date,time),'G'+(i+1));
    assert.equal(row.parents.length,1);
    assert.equal(row.parents[0].cell,cell);
    assert.equal(row.parents[0].signature,signature);
    delete row.oldWeights;
    rows.push(row);
  }
  return {rows,summary:gridSummary(rows)};
}

async function boundary(engine) {
  const rows=[];
  for(const c of SPRINT6_REPORT_CASES){
    const row=calculate(engine,c.request,c.id);
    assert.equal(row.status,c.expected.status,c.id);
    if(c.expected.pillars)assert.deepEqual(row.parents.map(p=>p.pillars),c.expected.pillars,c.id);
    if(c.expected.m5)assert.equal(row.parents[0].climateSource,c.expected.m5.status,c.id);
    if(c.expected.seasonalAlternativesPerParent)assert.deepEqual(row.parents.map(p=>p.seasonVariants),c.expected.seasonalAlternativesPerParent,c.id);
    delete row.oldWeights;
    rows.push(row);
  }
  const solar=request('2026-06-01','12:00');
  const {date,...common}=solar;
  const lunar={...common,calendar:'KOREAN_LUNAR',lunarDate:{lunarYear:2026,lunarMonth:4,lunarDay:16,leap:false}};
  const a=calculate(engine,solar,'SOLAR_EQUIVALENCE'),b=calculate(engine,lunar,'LUNAR_EQUIVALENCE');
  assert.ok(a.parents.length);
  assert.deepEqual(a.parents,b.parents);
  const timePolicies=[];
  for (const rollover of ['CIVIL_MIDNIGHT','ZI_START']) for(const hour of ['SELECTED_DAY_PILLAR','CIVIL_DATE_DAY_PILLAR']){
    const c=calculate(engine,request('2026-01-08','23:30',{policies:{...solar.policies,dayRollover:rollover,hourStemReference:hour}}),rollover+'_'+hour);
    assert.equal(c.parents.length,1);
    timePolicies.push(c);
  }
  return {rows:[...rows,a,b,...timePolicies].map(({oldWeights,...r})=>r),
    summary:{oldContracts:rows.length,statuses:tally(rows.map(r=>r.status)),solarLunarEqual:true,
      ziPolicies:timePolicies.map(r=>({id:r.id,dayHour:r.parents[0].pillars.slice(2)}))}};
}

const gradeComparison=(ours,theirs)=>{
  if(!['STRONG','WEAK'].includes(ours)||!['STRONG','WEAK'].includes(theirs))return 'BAND_NOT_EQUIVALENT';
  return ours===theirs?'SAME_DIRECTION_DIFFERENT_POLICY':'OPPOSITE_DIRECTIONS_POLICY_DIFFERENCE';
};
const ELEMENTS={MOK:'WOOD',HWA:'FIRE',TO:'EARTH',GEUM:'METAL',SU:'WATER'};
async function external(engine, dir) {
  assert.ok(dir,'archived external output directory is required');
  const [direct, native,old]=await Promise.all([
    readRows(join(dir,'korean-saju-ours-pillars.jsonl'),'bef022aa40f7591083736946088c8c9ec8d3b5a56d6e9f297abfd4e39dd95257'),
    readRows(join(dir,'ssaju-results.jsonl'),'7f284e61bceb8f4c3b6ae9269962b826a20e08e74281cf758e3c86a067350ef6'),
    readRows(join(dir,'poc-final-utc','rows.jsonl'),'539b5bd3a18a0593d8134ddbbd537e4ff9b2d11ef1da6936dbeeac00d922cc5c'),
  ]);
  const fixtures=JSON.parse(await readFile(inputPath,'utf8')).cases.filter(c=>c.category!=='historical');
  const rows=[], nativeRows=[];
  for (const f of fixtures) {
    const input=request(f.date,f.time,{calendar:f.calendar,experimentalPolicyId:WEIGHTED_SUPPORT_POLICY_ID,
      policies:{...SERVER_REQUEST_LITERAL_BASE.policies,dayRollover:f.policy.dayRollover==='ZI_START_23'?'ZI_START':f.policy.dayRollover,hourStemReference:f.policy.hourStemReference}});
    if(f.lunar){delete input.date;input.lunarDate={lunarYear:f.lunar.year,lunarMonth:f.lunar.month,lunarDay:f.lunar.day,leap:f.lunar.leap};}
    const calc=calculate(engine,input,f.id),baseline=old.find(r=>r.id===f.id);
    assert.deepEqual(calc.oldWeights,baseline.experimental,'legacy weighted policy changed '+f.id);
    assert.deepEqual(calc.parents.map(p=>p.pillars),baseline.candidates);
    for(const [i,p] of calc.parents.entries()){
      const id=f.id+'#'+i,other=direct.find(r=>r.id===id);
      assert.equal(other.status,'OK');assert.deepEqual(other.pillars,p.pillars);
      assert.equal(other.effectiveOptions.calendarInvocations,0);
      const target=other.advanced.yongsin;
      const candidate=ELEMENTS[target.yong_o_haeng.name];assert.ok(candidate);
      const foreignGrade=other.strengthNormalization.threeClass;
      const yongComparison=target.method.name!=='EOKBU'?'DIFFERENT_PURPOSE_'+target.method.name :
        !p.leaders.length?'E1_HOLD':p.leaders.some(c=>c.element===candidate)?'LEADING_ELEMENT_OVERLAP':'DIFFERENT_LEADING_ELEMENT';
      rows.push({id,pillars:p.pillars,grade:p.grade,score:p.score,externalGrade:foreignGrade,externalScore:other.strength.total,
        direction:gradeComparison(p.grade,foreignGrade),e1Leaders:p.leaders.map(c=>c.element),externalPurpose:target.method.name,
        externalElement:candidate,comparison:yongComparison,upstreamTenPointScoreEqualsLegacy:other.strength.total===calc.oldWeights[i].score.value});
    }
    const sameInput=native.find(r=>r.id===f.id);
    const p=calc.parents.find(c=>c.pillars.join('')===sameInput.pillars?.join(''));
    const theirs=sameInput.advanced?.dayStrength?.strength?.toUpperCase();
    nativeRows.push({id:f.id,upstreamStatus:sameInput.status,sameChart:!!p,
      comparison:sameInput.status!=='OK'?'UPSTREAM_'+sameInput.status:!p?'DIFFERENT_NATAL_CANDIDATE':gradeComparison(p.grade,theirs)});
  }
  assert.equal(rows.length,97);
  return {rows,nativeRows,summary:{requests:fixtures.length,verifiedSamePillarCandidates:rows.length,
    distinctFourPillars:new Set(rows.map(r=>r.pillars.join(''))).size,
    legacyExactObjectMatches:rows.length,legacyEqualsUpstreamTenPointScore:rows.filter(r=>r.upstreamTenPointScoreEqualsLegacy).length,
    koreanSajuGrade:tally(rows.map(c=>c.direction)),koreanSajuYong:tally(rows.map(c=>c.comparison)),
    ssajuNative:tally(nativeRows.map(c=>c.comparison))}};
}

if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  const [mode,pack,out,archive]=process.argv.slice(2);
  assert.ok(['grid','boundary','external'].includes(mode)&&pack&&out,'usage: e1-corpus.mjs grid|boundary|external DATA_PACK OUTPUT_DIR [ARCHIVED_OSS_DIR]');
  const engine=await loadEngineE1({dataDirectory:pack});
  const result=mode==='grid'?await grid(engine):mode==='boundary'?await boundary(engine):await external(engine,archive);
  await mkdir(out,{recursive:true});
  const json=JSON.stringify(result,null,2)+'\n';
  await writeFile(join(out,mode+'.json'),json,{flag:'wx'});
  console.log(JSON.stringify({stage:mode,sha256:digest(json),...result.summary}));
}
