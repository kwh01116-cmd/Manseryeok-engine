import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { compareCommercialCase, compareCommercialCorpus, compareBirthPolicies } from '../scripts/engine/e4-comparison.mjs';
import { E3_SELECTION } from '../scripts/engine/e3.mjs';

const request=JSON.parse(await readFile(new URL('../docs/contracts/examples/engine-e4-birth-policy-request-v1.json',import.meta.url),'utf8'));
const pillars=['甲午','己巳','丁卯','庚子'];
const url='https://doc.8-codes.com/docs/origin/yongsin/';
const sample={caseId:'PILLARS_ONLY',source:{provider:'定海',url,checkedAt:'2026-11-22',referenceKind:'PUBLISHED_PILLARS_ARCHIVED_SCORE'},
  input:{pillars},external:{pillars,visibleTenGods:['正印',null,null,null],
    strength:{label:'신강한 편',direction:'STRONG',score:69,scale:'PROPRIETARY_UNDISCLOSED'},
    yongshin:{purpose:'UNSPECIFIED',elements:['EARTH']},
    pattern:{scope:'TRADITIONAL_FORMATION',types:['正官']}},
  externalPolicyKnownFields:{},evidenceRefs:[url]};
const field=(report,name)=>report.differences.find(item=>item.field===name);

test('Published glyphs support structural fields without claiming a natal replay or comparing score scales',()=>{
  const r=compareCommercialCase(sample);
  assert.equal(field(r,'pillars').classification,'NOT_COMPARABLE');
  assert.equal(field(r,'strength').classification,'UNEXPLAINED_DISAGREEMENT');
  assert.equal(field(r,'strength').directionComparison,'INTERNAL_POLICY_BOUNDARY');
  assert.equal(field(r,'strength').internal.supportUnits,5300);
  assert.equal(field(r,'strength').external.score,69);
  assert.equal(field(r,'yongshin').classification,'NOT_COMPARABLE');
  assert.equal(field(r,'pattern').classification,'NOT_COMPARABLE');
  assert.deepEqual(field(r,'visibleTenGods').matchedPositions,['year']);
  assert.equal(field(r,'twelveGrowth').classification,'NO_REFERENCE');
  assert.deepEqual(r.suspectedDefects,[]);
  assert.deepEqual(compareCommercialCase(sample),r);
});

test('Reference mismatch, unknown sources and unsupported policy assertions fail separately',()=>{
  const unknown=compareCommercialCase({...sample,source:undefined});
  assert.equal(field(unknown,'strength').classification,'INSUFFICIENT_REFERENCE');
  assert.equal(unknown.diagnostics,null);
  assert.throws(()=>compareCommercialCase({...sample,input:{pillars:['甲子',...pillars.slice(1)]}}),/PILLARS_CONFLICT/);
  assert.throws(()=>compareCommercialCase({...sample,external:{pillars,strength:{label:'강'}}}),/EXPLICIT_MAPPING/);
  assert.throws(()=>compareCommercialCase({...sample,externalPolicyKnownFields:{differenceEvidence:
    {pillars:{reason:'claim only',ref:url}}}}),/DIFFERENCE_EVIDENCE_REQUIRED/);
  assert.throws(()=>compareCommercialCorpus({schemaVersion:'engine-comparison-commercial-corpus-v1',cases:[sample,sample]}),/CORPUS_CONTRACT/);
});

test('A dated comparison cannot borrow the chart features of a different candidate',()=>{
  const cand={id:'chart.candidates[0]',pillars:pillars.map(p=>({stem:p[0],branch:p[1]}))};
  const source={...sample,input:{pillars,birth:{date:'2001-06-01',time:'08:00',place:'서울',calendar:'GREGORIAN'}}};
  const unrelated={calculate:()=>({e2:{existing:{candidates:[cand]},
    candidates:[{candidateRef:cand.id,features:{strength:{result:{candidateRef:'chart.candidates[1]'}}}}]},
    candidates:[]})};
  assert.throws(()=>compareCommercialCase(source,unrelated),/E4_FOREIGN_CANDIDATE/);
});

test('Identical coordinates remain separate native requests and incompatible E3 policy is rejected',()=>{
  const calendar={calculate:b=>({status:'FIXTURE',e2:{existing:{calculation:{input:{gregorianDate:b.date,time:b.time}},
    candidates:[],holds:[]}},candidates:[]})};
  const r=compareBirthPolicies(calendar,request.left,request.right,request.selection);
  assert.equal(r.sameBirth,true);
  assert.equal(r.selectedPoliciesDiffer,true);
  assert.equal(r.classification,'NOT_COMPARABLE');
  assert.equal(compareBirthPolicies(calendar,request.left,{...request.right,date:'2026-01-09'},E3_SELECTION).sameBirth,false);
  assert.throws(()=>compareBirthPolicies(calendar,request.left,request.right,{...E3_SELECTION,version:'0.2.0'}),/EXPLICIT_E3/);
});

test('A lunar representation alone does not explain a different chart for the same published minute',()=>{
  const left=request.left;
  const {date,...same}=left;
  const right={...same,calendar:'KOREAN_LUNAR',lunarDate:{lunarYear:2025,lunarMonth:11,lunarDay:20,leap:false}};
  const engine={calculate:b=>{
    const values=b.calendar==='GREGORIAN'?pillars:['乙未',...pillars.slice(1)];
    const candidateRef='chart.candidates[0]';
    const candidate={id:candidateRef,pillars:values.map(p=>({stem:p[0],branch:p[1]}))};
    return {status:'FIXTURE',e2:{existing:{calculation:{input:{gregorianDate:date,time:b.time}},holds:[],candidates:[candidate]},
      candidates:[{candidateRef,features:{chart:{result:{seasonal:null}},strength:{result:null}}}]},
      candidates:[{candidateRef,features:{patternRules:{result:{status:'OUT_OF_SCOPE'}}}}]};
  }};
  const result=compareBirthPolicies(engine,left,right,E3_SELECTION);
  assert.equal(result.sameBirth,true);
  assert.equal(result.selectedPoliciesDiffer,false);
  assert.equal(result.calendarFormatDiffer,true);
  assert.equal(result.classification,'IMPLEMENTATION_DEFECT'); // synthetic discrepancy, not a live calendar result
});
