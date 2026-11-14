// Literal contracts fixed before innerPatternsV1 resolver implementation.
// Fictional structural units: no birth feasibility, classical quotation or efficacy claim.
export const M4_INNER_CASE_BASIS = Object.freeze({
  expectationMethod:'MANUAL_LITERAL_CONTRACTS_FIXED_BEFORE_RESOLVER',
  policyRef:'M4-INNER-EIGHT-MONTH-STRUCTURE-V01',
  selectionLayer:'PROJECT_POLICY_NOT_UNIVERSAL_CLASSICAL_FORMATION',
  sourceRefs:['docs/research/M4_ZHENGGUAN_STRUCTURE_POLICY_V01.md','src/domain/hiddenStems.ts','src/domain/tenGods.ts'],
  mustNotInfer:['成格','破格','救應','STRENGTH','USEFUL_GOD','WEIGHTS','REAL_BIRTH'],
});

export const M4_INNER_CASES = [
  {id:'main-officer-unexposed',pillars:['乙卯','乙酉','甲子','丙寅'],monthTerm:'BAILU',expected:{main:'正官',primary:'正官',candidates:['正官'],unresolved:[],focus:'正官',status:'STRUCTURAL_CANDIDATE',basis:'MAIN_QI',exposures:[]},reason:'酉辛本氣 is 官 without surface 辛.'},
  {id:'main-killings-unexposed',pillars:['乙卯','丙申','甲子','丁卯'],monthTerm:'LIQIU',expected:{main:'七殺',primary:'七殺',candidates:['七殺'],unresolved:[],focus:'七殺',status:'STRUCTURAL_CANDIDATE',basis:'MAIN_QI',exposures:[]},reason:'申庚本氣 is 殺; neither 壬 nor 戊 is exposed.'},
  {id:'main-direct-wealth-unexposed',pillars:['乙卯','丁丑','甲子','丙寅'],monthTerm:'XIAOHAN',expected:{main:'正財',primary:'正財',candidates:['正財'],unresolved:[],focus:'正財',status:'STRUCTURAL_CANDIDATE',basis:'MAIN_QI',exposures:[]},reason:'丑己本氣 is 財 without surface 己.'},
  {id:'main-indirect-wealth-peer-competition',pillars:['乙卯','丙辰','甲子','丁卯'],monthTerm:'QINGMING',expected:{main:'偏財',primary:'偏財',candidates:['偏財'],unresolved:[],focus:'偏財',status:'STRUCTURAL_CANDIDATE',basis:'MAIN_QI',exposures:[],competition:true},reason:'辰戊本氣 remains while other-member 乙 has one non-day exposure position.'},
  {id:'main-direct-resource-unexposed',pillars:['乙卯','甲子','甲午','丙寅'],monthTerm:'DAXUE',expected:{main:'正印',primary:'正印',candidates:['正印'],unresolved:[],focus:'正印',status:'STRUCTURAL_CANDIDATE',basis:'MAIN_QI',exposures:[]},reason:'子癸本氣 is 印 without surface 癸.'},
  {id:'main-indirect-resource-day-match-only',pillars:['乙卯','丁亥','甲子','丙寅'],monthTerm:'LIDONG',expected:{main:'偏印',primary:'偏印',candidates:['偏印'],unresolved:[],focus:'偏印',status:'STRUCTURAL_CANDIDATE',basis:'MAIN_QI',exposures:[],competition:false,dayOnly:['甲']},reason:'亥壬 is 梟; hidden 甲 matches only the excluded day stem.'},
  {id:'main-food-unexposed',pillars:['乙卯','丁巳','甲子','乙卯'],monthTerm:'LIXIA',expected:{main:'食神',primary:'食神',candidates:['食神'],unresolved:[],focus:'食神',status:'STRUCTURAL_CANDIDATE',basis:'MAIN_QI',exposures:[]},reason:'巳丙本氣 is 食神 without surface 丙.'},
  {id:'main-hurting-officer-wu-compatibility',pillars:['乙卯','壬午','甲子','丙寅'],monthTerm:'MANGZHONG',expected:{main:'傷官',primary:'傷官',candidates:['傷官'],unresolved:['正財'],focus:'傷官',status:'STRUCTURAL_CANDIDATE',basis:'MAIN_QI',exposures:[]},reason:'午丁 MAIN remains a candidate while OTHER 己 has a separate compatibility deferral.'},
  {id:'other-officer-exact-year',pillars:['辛酉','丁丑','甲子','丙寅'],monthTerm:'XIAOHAN',expected:{main:'正財',primary:'正財',candidates:['正官','正財'],unresolved:[],focus:'正官',status:'STRUCTURAL_CANDIDATE',basis:'EXACT_NON_DAY_EXPOSED_OTHER',exposures:[{role:'year',stem:'辛'}],competition:true},reason:'丑辛 OTHER exactly matches year 辛; main 己 is retained.'},
  {id:'other-officer-wrong-polarity-no-exposure',pillars:['庚申','丁丑','甲子','丙寅'],monthTerm:'XIAOHAN',expected:{main:'正財',primary:'正財',candidates:['正財'],unresolved:[],focus:'正官',status:'NOT_A_CANDIDATE_UNDER_POLICY',basis:'OTHER_NOT_EXPOSED',exposures:[]},reason:'庚 and 辛 share an element but are different characters.'},
  {id:'other-officer-not-exposed',pillars:['乙卯','丁丑','甲子','丙寅'],monthTerm:'XIAOHAN',expected:{main:'正財',primary:'正財',candidates:['正財'],unresolved:[],focus:'正官',status:'NOT_A_CANDIDATE_UNDER_POLICY',basis:'OTHER_NOT_EXPOSED',exposures:[]},reason:'The hidden officer exists but no selected exact non-day exposure exists.'},
  {id:'other-killings-exact-year',pillars:['庚申','丁巳','甲子','乙卯'],monthTerm:'LIXIA',expected:{main:'食神',primary:'食神',candidates:['七殺','食神'],unresolved:[],focus:'七殺',status:'STRUCTURAL_CANDIDATE',basis:'EXACT_NON_DAY_EXPOSED_OTHER',exposures:[{role:'year',stem:'庚'}]},reason:'巳庚 OTHER exactly matches year 庚; this does not establish 食神制殺 efficacy.'},
  {id:'other-direct-wealth-exact-year',pillars:['戊辰','丙申','乙丑','丁卯'],monthTerm:'LIQIU',expected:{main:'正官',primary:'正官',candidates:['正官','正財'],unresolved:[],focus:'正財',status:'STRUCTURAL_CANDIDATE',basis:'EXACT_NON_DAY_EXPOSED_OTHER',exposures:[{role:'year',stem:'戊'}]},reason:'For 乙 day, 申戊 OTHER is 正財 and exact 戊 appears at year.'},
  {id:'other-indirect-wealth-exact-year',pillars:['戊辰','丁巳','甲子','乙卯'],monthTerm:'LIXIA',expected:{main:'食神',primary:'食神',candidates:['偏財','食神'],unresolved:[],focus:'偏財',status:'STRUCTURAL_CANDIDATE',basis:'EXACT_NON_DAY_EXPOSED_OTHER',exposures:[{role:'year',stem:'戊'}]},reason:'For 甲 day, 巳戊 OTHER is 偏財; main 食神 survives.'},
  {id:'other-direct-resource-exact-year',pillars:['癸亥','丁丑','甲子','丙寅'],monthTerm:'XIAOHAN',expected:{main:'正財',primary:'正財',candidates:['正財','正印'],unresolved:[],focus:'正印',status:'STRUCTURAL_CANDIDATE',basis:'EXACT_NON_DAY_EXPOSED_OTHER',exposures:[{role:'year',stem:'癸'}]},reason:'丑癸 OTHER exactly matches year 癸.'},
  {id:'other-indirect-resource-exact-year',pillars:['壬辰','丙申','甲子','丁卯'],monthTerm:'LIQIU',expected:{main:'七殺',primary:'七殺',candidates:['七殺','偏印'],unresolved:[],focus:'偏印',status:'STRUCTURAL_CANDIDATE',basis:'EXACT_NON_DAY_EXPOSED_OTHER',exposures:[{role:'year',stem:'壬'}]},reason:'申壬 OTHER is 偏印; 殺印 relation remains observational.'},
  {id:'other-food-exact-year',pillars:['丁卯','癸未','乙丑','辛巳'],monthTerm:'XIAOSHU',expected:{main:'偏財',primary:'偏財',candidates:['偏財','食神'],unresolved:[],focus:'食神',status:'STRUCTURAL_CANDIDATE',basis:'EXACT_NON_DAY_EXPOSED_OTHER',exposures:[{role:'year',stem:'丁'}],dayOnly:['乙']},reason:'乙 day sees 未丁 as 食神; OTHER 乙 matches only the day stem.'},
  {id:'other-hurting-officer-exact-year',pillars:['乙卯','丙辰','壬子','丁卯'],monthTerm:'QINGMING',expected:{main:'七殺',primary:'七殺',candidates:['七殺','傷官'],unresolved:[],focus:'傷官',status:'STRUCTURAL_CANDIDATE',basis:'EXACT_NON_DAY_EXPOSED_OTHER',exposures:[{role:'year',stem:'乙'}]},reason:'壬 day sees 辰乙 as 傷官; main 戊殺 remains.'},
  {id:'two-other-members-exposed-keep-all',pillars:['辛酉','丁丑','甲子','癸卯'],monthTerm:'XIAOHAN',expected:{main:'正財',primary:'正財',candidates:['正官','正財','正印'],unresolved:[],focus:'正印',status:'STRUCTURAL_CANDIDATE',basis:'EXACT_NON_DAY_EXPOSED_OTHER',exposures:[{role:'hour',stem:'癸'}],competition:true},reason:'丑己 main, 辛 and 癸 OTHER remain three candidates without exclusive classical selection.'},
  {id:'repeated-exact-exposure-positions',pillars:['辛酉','丁丑','甲子','辛卯'],monthTerm:'XIAOHAN',expected:{main:'正財',primary:'正財',candidates:['正官','正財'],unresolved:[],focus:'正官',status:'STRUCTURAL_CANDIDATE',basis:'EXACT_NON_DAY_EXPOSED_OTHER',exposures:[{role:'year',stem:'辛'},{role:'hour',stem:'辛'}]},reason:'Two positions of the same exposed member remain two links, not double force.'},
  {id:'peer-main-without-other-exposure',pillars:['乙卯','壬寅','甲子','癸卯'],monthTerm:'LICHUN',expected:{main:'比肩',primary:null,candidates:[],unresolved:[],selection:'PEER_MAIN_OUT_OF_SCOPE',focus:'食神',status:'NOT_A_CANDIDATE_UNDER_POLICY',basis:'OTHER_NOT_EXPOSED',exposures:[]},reason:'比肩 MAIN is outside inner8; no invented 建祿 or forced八格.'},
  {id:'peer-main-with-other-exposure-ambiguous',pillars:['丙寅','壬寅','甲子','癸卯'],monthTerm:'LICHUN',expected:{main:'比肩',primary:null,candidates:['食神'],unresolved:[],selection:'PEER_MAIN_WITH_EXPOSED_OTHER_UNRESOLVED',focus:'食神',status:'STRUCTURAL_CANDIDATE',basis:'EXACT_NON_DAY_EXPOSED_OTHER',exposures:[{role:'year',stem:'丙'}]},reason:'OTHER 食神 can be observed, but this project does not select it over peer MAIN or infer 建祿.'},
  {id:'rob-wealth-main-out-of-scope',pillars:['丁卯','乙卯','甲子','壬申'],monthTerm:'JINGZHE',expected:{main:'劫財',primary:null,candidates:[],unresolved:[],selection:'PEER_MAIN_OUT_OF_SCOPE',focus:'正官',status:'NOT_A_CANDIDATE_UNDER_POLICY',basis:'NO_MONTH_MEMBER',exposures:[]},reason:'劫財 MAIN does not automatically become 羊刃 or an inner8 type.'},
  {id:'wu-other-officer-exposed-legacy-compatible',pillars:['己巳','丙午','壬寅','庚子'],monthTerm:'MANGZHONG',expected:{main:'正財',primary:'正財',candidates:['正財'],unresolved:['正官'],focus:'正官',status:'SOURCE_OR_POLICY_UNRESOLVED',basis:'WU_OTHER_MEMBER_COMPATIBILITY_DEFERRED',exposures:[{role:'year',stem:'己'}]},reason:'Old 正官 午OTHER 己 deferral survives exact exposure.'},
  {id:'wu-other-officer-unexposed-legacy-compatible',pillars:['乙巳','丙午','壬寅','庚子'],monthTerm:'MANGZHONG',expected:{main:'正財',primary:'正財',candidates:['正財'],unresolved:['正官'],focus:'正官',status:'SOURCE_OR_POLICY_UNRESOLVED',basis:'WU_OTHER_MEMBER_COMPATIBILITY_DEFERRED',exposures:[]},reason:'Compatibility is not ordinary unexposed-OTHER absence.'},
  {id:'wu-other-wealth-exposed-new-policy-scope',pillars:['己巳','壬午','甲子','丙寅'],monthTerm:'MANGZHONG',expected:{main:'傷官',primary:'傷官',candidates:['傷官'],unresolved:['正財'],focus:'正財',status:'SOURCE_OR_POLICY_UNRESOLVED',basis:'WU_OTHER_MEMBER_COMPATIBILITY_DEFERRED',exposures:[{role:'year',stem:'己'}]},reason:'The new policy explicitly defers this same 午OTHER member across inner8; old officer output is not changed.'},
];

export const M4_INNER_BOUNDARY_CONTRACT = {
  id:'lichun-correlated-existing-parents',
  pillars:[['乙巳','己丑','己酉','丁卯'],['丙午','庚寅','己酉','丁卯']],
  monthTerms:['XIAOHAN','LICHUN'],
  expected:[{primary:null,candidates:[],main:'比肩',selection:'PEER_MAIN_OUT_OF_SCOPE'},{primary:'正官',candidates:['正官','正印'],main:'正官',selection:'MAIN_QI_WITH_COMPETING_EXPOSURES'}],
  reason:'Known existing parent pillars are independently assessed; year/month candidates never form a cross product.',
};

export const M4_INNER_REJECTION_CONTRACTS = [
  {id:'missing-month-hidden-fact',mutation:'REMOVE_REQUIRED_MONTH_FACT',expected:'REJECT'},
  {id:'sparse-month-members',mutation:'DELETE_MONTH_MEMBER_SLOT',expected:'REJECT'},
  {id:'foreign-parent-member',mutation:'COPY_OTHER_PARENT_MONTH_MEMBER',expected:'REJECT'},
  {id:'unknown-rule-source',mutation:'UNKNOWN_REFERENCE',expected:'REJECT'},
  {id:'foreign-issued-context',mutation:'USE_EQUAL_BUT_DIFFERENT_M2_OBJECT',expected:'REJECT'},
  {id:'wrong-or-missing-policy',mutation:'UNSUPPORTED_PROFILE',expected:'REJECT'},
  {id:'forged-result',mutation:'CLONE_ISSUED_RESULT',expected:'REJECT'},
];
