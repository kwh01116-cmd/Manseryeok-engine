import {M7_LUCK_POLICY_METADATA} from '../../dist/luck/luckV01.js';
import {twelveGrowthStage,TWELVE_GROWTH_POLICY_V1} from '../../dist/domain/twelveGrowthStages.js';

const m7=M7_LUCK_POLICY_METADATA;

function availability(status) {
  switch(status){
    case 'OK': case 'RESOLVED_UNDER_POLICY': case 'PROJECTED_UNDER_POLICY':
    case 'BEFORE_BIRTH': case 'BEFORE_FIRST_DA_YUN': return 'AVAILABLE';
    case 'NEEDS_DATA': case 'POLICY_UNRESOLVED': return status;
    case 'INVALID_INPUT': return 'NEEDS_INPUT';
    default: return 'PARTIAL';
  }
}

function combined(statuses) {
  const values=[...new Set(statuses.filter(Boolean).map(availability))];
  return values.length===1 ? values[0] : 'PARTIAL';
}

/** Calendar-year queries are independent of natal alternatives. The optional
 * growth labels below always use this specific natal candidate's day master. */
export function projectTemporal(existing,index,feature,monthlyPolicy,pendingDayunRequest=null) {
  const d=existing.analysisData, b=d.base, request=existing.request;
  const luck=b?.m7?.luck, lc=luck?.candidates[index], pc=b?.projection?.projection.candidates[index];
  const natal=existing.candidates[index];
  if ((lc && lc.candidateRef!==natal.id) || (pc && pc.candidateRef!==natal.id))
    throw new RangeError('E2_FOREIGN_LUCK_CANDIDATE');
  const base='/existing/analysisData/base', luckPath=base+'/m7/luck', monthPath='/existing/analysisData/monthly';
  const dp=luckPath+'/candidates/'+index+'/dayun', pp=base+'/projection/projection/candidates/'+index;
  const dpRefs=[dp,...(pc?[pp]:[])];
  const features=request.luckOptions?.features;
  function missing(id,requested){
    const historical=existing.modules.M7.status==='POLICY_UNRESOLVED' && requested;
    return feature(id,m7,historical?'POLICY_UNRESOLVED':'NEEDS_INPUT',null,
      [id==='daeun' && pendingDayunRequest?'/inputContext/pendingDayunRequest':'/existing/request'],
      [historical?'M7_CLOCK_SCOPE_NOT_ADOPTED':id==='daeun'?'EXPLICIT_TRADITIONAL_SEX_COUNT_AND_POLICY_REQUIRED':'EXPLICIT_YEAR_OR_QUERY_MINUTE_REQUIRED']);
  }
  const daeun=lc?.dayun && features?.dayun
    ? feature('daeun',m7,combined([lc.dayun.status,pc?.calendar.status,
        ...(request.luckOptions?.asOfMinute?[pc?.selection.status]:[])]),
        {calculation:lc.dayun,projection:pc??null},dpRefs,
        [...(pc?[]:['NOMINAL_PROJECTION_NOT_SELECTED']),...([lc.dayun.start?.status,pc?.calendar.status,pc?.selection?.status]
          .filter(s=>s && !['OK','PROJECTED_UNDER_POLICY','RESOLVED_UNDER_POLICY'].includes(s))),
          'NOMINAL_UNDER_POLICY_NOT_CERTIFIED_INSTANT'])
    : missing('daeun',Boolean(features?.dayun));
  const annual=features?.seyun && lc?.seyun;
  const annualPath=luckPath+'/candidates/'+index+'/seyun';
  const annualParts=annual?[annual.yearLabel,annual.atMinute].filter(Boolean):[];
  const seyun=annual
    ? feature('seyun',m7,combined(annualParts.map(s=>s.status)),annual,[annualPath],
        ['INDEPENDENT_TIME_QUERY',...annualParts.filter(s=>availability(s.status)!=='AVAILABLE').map(s=>s.status)])
    : missing('seyun',Boolean(features?.seyun));
  const monthly=d.monthly, parts=[monthly.atMinute,monthly.yearTable].filter(Boolean);
  const monthlyStatus=parts.length?combined(parts.map(x=>x.status)):
    monthly.status==='POLICY_UNRESOLVED'?'POLICY_UNRESOLVED':'NEEDS_INPUT';
  const monthlyFeature=feature('monthly',monthly.policy??monthlyPolicy,monthlyStatus,
    monthly,[monthPath],parts.length?['TWELVE_JIE_MONTHS',...parts.filter(s=>availability(s.status)!=='AVAILABLE').map(s=>s.status),
    ...(monthly.yearTable?.rows.some(r=>r.status==='NEEDS_DATA')?['NEEDS_DATA_FOR_INCOMPLETE_INTERVALS']:[])]:
    [monthly.reason??'EXPLICIT_YEAR_OR_QUERY_MINUTE_REQUIRED']);

  const temporal=[];
  const dayStem=natal.pillars[2].stem;
  function stage(axis,pillar,reference,scope,details) {
    if (pillar) temporal.push({axis,scope,...details,sourcePath:reference,
      ...twelveGrowthStage(dayStem,pillar.branch,TWELVE_GROWTH_POLICY_V1)});
  }
  lc?.dayun?.sequence?.entries?.forEach((entry,i)=>stage('DAEUN',entry.pillar,dp+'/sequence/entries/'+i,'SEQUENCE',{ordinal:entry.ordinal}));
  if(annual?.yearLabel)stage('SEYUN',annual.yearLabel.pillar,annualPath+'/yearLabel','YEAR_LABEL',{year:annual.yearLabel.year});
  annual?.atMinute?.entries.forEach((entry,i)=>stage('SEYUN',entry.pillar,annualPath+'/atMinute/entries/'+i,'QUERY_ALTERNATIVE',{alternativeIndex:i}));
  monthly.atMinute?.entries.forEach((entry,i)=>stage('MONTHLY',entry.monthPillar,monthPath+'/atMinute/entries/'+i,
    'QUERY_ALTERNATIVE',{alternativeIndex:i,intervalStatus:entry.intervalStatus}));
  monthly.yearTable?.rows.forEach((row,i)=>stage('MONTHLY',row.monthPillar,monthPath+'/yearTable/rows/'+i,
    'YEAR_TABLE_LABEL',{ordinal:row.ordinal,intervalStatus:row.status}));
  return {daeun,seyun,monthly:monthlyFeature,temporal};
}
