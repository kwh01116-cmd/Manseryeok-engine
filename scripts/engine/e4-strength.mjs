/** Independent E1 arithmetic and partial public rule reconstruction for audits. */
const policyId = 'E4-STRENGTH-DIAGNOSTICS-V01';
const policyVersion = '0.1.0';
const E1_ID = 'M3-PRODUCT-POSITIONAL-STRENGTH-V01';
const E1_VERSION = '0.1.0';
const roles = ['year','month','day','hour'];
const stems = '甲乙丙丁戊己庚辛壬癸';
const branches = '子丑寅卯辰巳午未申酉戌亥';
const elements = ['WOOD','FIRE','EARTH','METAL','WATER'];
const families = ['PEER','OUTPUT','WEALTH','OFFICER','RESOURCE'];
const hidden = {
  子:'癸', 丑:'己癸辛', 寅:'甲丙戊', 卯:'乙', 辰:'戊乙癸', 巳:'丙庚戊',
  午:'丁己', 未:'己丁乙', 申:'庚壬戊', 酉:'辛', 戌:'戊辛丁', 亥:'壬甲',
};
const branchBudget = [1000,3000,2000,1000];
const surfaceBudget = [800,1200,0,1000];
const mainShares = [0,100,70,60];
const support = family => family === 'PEER' || family === 'RESOURCE';
const grade = (units, weakBelow=4500, strongAbove=5500) =>
  units < weakBelow ? 'WEAK' : units > strongAbove ? 'STRONG' : 'BORDERLINE';

const publicCases = {
  '丙子辛卯己巳己巳': { provider:'BYULCODE', sourceUrl:'https://byulcode.kr/manse/', replacements:{ 子:'癸壬', 卯:'乙甲' } },
  '甲午己巳丁卯庚子': { provider:'8-CODES', sourceUrl:'https://doc.8-codes.com/docs/lecture/11/', replacements:{ 午:'丁己丙', 卯:'乙甲', 子:'癸壬' } },
};
function freeze(item) {
  if (item && typeof item === 'object' && !Object.isFrozen(item)) {
    for (const field of Object.values(item)) freeze(field);
    Object.freeze(item);
  }
  return item;
}
function normalize(input) {
  if (!Array.isArray(input) || input.length !== 4)
    throw new RangeError('E4_STRENGTH_FOUR_ORDERED_PILLARS_REQUIRED');
  return roles.map((role,index) => {
    const entry = input[index];
    let label;
    if (typeof entry === 'string') label = entry;
    else if (entry && typeof entry === 'object'
      && (!Object.hasOwn(entry,'role') || entry.role === role)
      && typeof entry.stem === 'string' && typeof entry.branch === 'string')
      label = entry.stem + entry.branch;
    if (!label || label.length !== 2 || !stems.includes(label[0]) || !branches.includes(label[1])
      || stems.indexOf(label[0]) % 2 !== branches.indexOf(label[1]) % 2)
      throw new RangeError('E4_STRENGTH_VALID_PILLAR_REQUIRED');
    return label;
  });
}
function composePositions(pillars, { budgets=branchBudget, mainDelta=0, principalOnly=false, inventory=hidden }={}) {
  const elementIndex = stem => Math.floor(stems.indexOf(stem)/2);
  const dayElement = elementIndex(pillars[2][0]);
  const component = (stem,units,kind,memberPosition) => ({
    kind, memberPosition, stem, element:elements[elementIndex(stem)],
    family:families[(elementIndex(stem)-dayElement+5)%5], units,
  });
  return pillars.map(([stem,branch],i) => {
    const members = [...inventory[branch]];
    const principal = budgets[i] * (principalOnly || members.length === 1 ? 100 : mainShares[members.length]+mainDelta) / 100;
    const branchMembers = members.map((item,index) => component(
      item,index ? (budgets[i]-principal)/(members.length-1) : principal,'HIDDEN',index ? 'OTHER' : 'MAIN_QI'));
    const surface = surfaceBudget[i] ? component(stem,surfaceBudget[i],'SURFACE',null) : null;
    const components = surface ? [surface,...branchMembers] : branchMembers;
    const branchSupportUnits = sumSupport(branchMembers);
    return {role:roles[i], pillar:stem+branch, branch, surface, branchMembers, components,
      branchBudgetUnits:budgets[i], branchSupportUnits, supportUnits:sumSupport(components)};
  });
}
const sumSupport = components => components.reduce((sum,x) => support(x.family) ? sum+x.units : sum,0);
const totalSupport = positions => positions.reduce((sum,x) => sum+x.supportUnits,0);
function relationIndicators(positions) {
  const clashes = ['子午','丑未','寅申','卯酉','辰戌','巳亥'];
  const combinations = ['甲己','乙庚','丙辛','丁壬','戊癸'];
  const branchClashes = [], stemCombinations = [];
  const pairsWith = (a,b,table) => a!==b && table.some(row=>row.includes(a) && row.includes(b));
  for (let i=0; i<positions.length; i++) {
    for (let j=i+1; j<positions.length; j++) {
      const left=positions[i], right=positions[j], indices=[i,j];
      if (pairsWith(left.branch,right.branch,clashes))
        branchClashes.push({indices,branches:[left.branch,right.branch],
          affectedBranchSupportUnits:[left.branchSupportUnits,right.branchSupportUnits]});
      if (pairsWith(left.pillar[0],right.pillar[0],combinations))
        stemCombinations.push({indices,stems:[left.pillar[0],right.pillar[0]]});
    }
  }
  return { branchClashes, stemCombinations, effects:'NOT_EVALUATED' };
}

export function compareStrengthDiagnostics(input) {
  const pillars = normalize(input);
  const positions = composePositions(pillars);
  const components = positions.flatMap(x => x.components);
  const roleUnits = Object.fromEntries(families.map(family => [
    family,components.filter(x=>x.family===family).reduce((sum,x)=>sum+x.units,0),
  ]));
  const supportUnits = totalSupport(positions);
  const baseGrade = grade(supportUnits);
  const dayMaster = pillars[2][0];
  const dayRootStems = positions[2].branchMembers.filter(x=>x.family==='PEER').map(x=>x.stem);
  const dayResourceStems = positions[2].branchMembers.filter(x=>x.family==='RESOURCE').map(x=>x.stem);
  const evidence = positions.flatMap(p=>p.components.map(x=>({role:p.role,...x})));
  const peripheral = [...positions[0].components,...positions[1].components.filter(x=>x.kind==='SURFACE'),...positions[3].components];
  const powerUnits = sumSupport(peripheral);
  const countPositions = [
    positions[0].surface,positions[1].surface,positions[3].surface,
    positions[0].branchMembers[0],positions[3].branchMembers[0],
  ];
  const projectionCount = countPositions.filter(x=>support(x.family)).length;
  const flags = { deukryeong:support(positions[1].branchMembers[0].family), deukji:dayRootStems.length>0, deukse:powerUnits>2500 };
  const recalculate = options => totalSupport(composePositions(pillars,options));
  const probe = (id,units,weakBelow=4500,strongAbove=5500) => ({
    id,supportUnits:units,deltaUnits:units-supportUnits,grade:grade(units,weakBelow,strongAbove),
    weakBelowUnits:weakBelow,strongAboveUnits:strongAbove,
  });
  const probes = [
    probe('MONTH_26',recalculate({budgets:[1200,2600,2000,1200]})),
    probe('MONTH_34',recalculate({budgets:[800,3400,2000,800]})),
    probe('MAIN_SHARE_MINUS_10PP',recalculate({mainDelta:-10})),
    probe('MAIN_SHARE_PLUS_10PP',recalculate({mainDelta:10})),
    probe('BAND_43_53',supportUnits,4300,5300),
    probe('BAND_47_57',supportUnits,4700,5700),
  ];
  const sample = publicCases[pillars.join('')];
  const counterfactualUnits = sample ? recalculate({inventory:{...hidden,...sample.replacements}}) : null;
  const principalOnlyUnits = recalculate({principalOnly:true});
  const unweightedSupportCount = positions.reduce((count,p)=>count +
    Number(Boolean(p.surface && support(p.surface.family))) + Number(support(p.branchMembers[0].family)),0);
  return freeze({
    schemaVersion:'engine-e4-strength-diagnostics-v1',policyId,policyVersion,pillars,dayMaster,
    baseline:{policyId:E1_ID,policyVersion:E1_VERSION,supportUnits,totalUnits:10000,grade:baseGrade,roleUnits,positions,flags,
      powerUnits,powerComparison:powerUnits===2500?'TIED':powerUnits>2500?'SUPPORT_MAJORITY':'OPPOSITION_MAJORITY',
      roots:positions.map(p=>({role:p.role,
        exact:p.branchMembers.filter(x=>x.stem===dayMaster).map(x=>x.stem),
        sameElementOther:p.branchMembers.filter(x=>x.family==='PEER' && x.stem!==dayMaster).map(x=>x.stem),
        resource:p.branchMembers.filter(x=>x.family==='RESOURCE').map(x=>x.stem)})),
      dayRootStems,dayResourceStems,specialReview:supportUnits<=1000||supportUnits>=9000,
      supportingEvidence:evidence.filter(x=>support(x.family)),opposingEvidence:evidence.filter(x=>!support(x.family))},
    sensitivity:{probes,stressOnly:probe('PRINCIPAL_ONLY',principalOnlyUnits),
      status:probes.some(p=>p.grade!==baseGrade)?'SENSITIVE_TO_POLICY':'STABLE_IN_PROBES'},
    supportAttribution:{
      basis:'E1_MAIN_QI_THEN_BUDGET_THEN_HIDDEN_STEM_SPLIT',
      unweightedWithDayMaster:{supported:unweightedSupportCount+1,total:8},
      unweightedExcludingDayMaster:{supported:unweightedSupportCount,total:7},
      e1PositionalPrincipalOnlyUnits:principalOnlyUnits,
      e1HiddenStemSplitDeltaUnits:supportUnits-principalOnlyUnits,
    },
    publicDefinitionProjection:{
      flags:{deukryeong:flags.deukryeong,deukji:support(positions[2].branchMembers[0].family),deukse:projectionCount>=2},
      supportingPositionCount:projectionCount,grade:null,
      basis:'PUBLISHED_8_CODES_FLAG_DEFINITIONS_WITH_E1_MAIN_QI_CONVENTION',
      sourceUrl:'https://doc.8-codes.com/docs/origin/yongsin/',
    },
    hiddenInventoryCounterfactual:sample ? {policyId,policyVersion,sourceUrl:sample.sourceUrl,provider:sample.provider,
      changedMembership:sample.replacements,grade:grade(counterfactualUnits),supportUnits:counterfactualUnits,
      deltaUnits:counterfactualUnits-supportUnits} : null,
    thresholdDistances:{
      addUnitsToExitWeak:Math.max(0,4500-supportUnits),
      addUnitsToStrong:Math.max(0,5501-supportUnits),
      removeUnitsToWeak:Math.max(0,supportUnits-4499),
    },
    structuralDiagnostics:relationIndicators(positions),
  });
}
