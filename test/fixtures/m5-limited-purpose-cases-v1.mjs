// Fixed before src/m5/limitedPurposeV1.ts was created. Synthetic structural units,
// not asserted to be complete charts of actual births or predictive ground truth.
export const M5_CASE_BASIS=Object.freeze({
  method:'LITERAL_PROJECT_DECISION_TABLE_FIXED_BEFORE_RESOLVER',
  policyId:'M5-WINTER-WOOD-WARMING-CANDIDATE-V01',
  purpose:'WINTER_WOOD_WARMING_REVIEW',
  sourceRef:'M5-ZPZQ-CLIMATE-NCC-ORIGINAL',
  commentaryRef:'M5-ZPZQ-CLIMATE-NCC-XU',
  literatureScope:'Winter-wood/fire climate context only; no full final useful-god algorithm',
  guardAuthority:'PROJECT_POLICY: existing observed FIRE means sufficiency is unknown; do not automatically prescribe more',
  sourceUrl:'https://ncc.com.tw/fate/paleo/bg/bg_033.htm',
  excluded:['FINAL_USEFUL_GOD','BODY_STRENGTH','PATTERN_SUCCESS','FORTUNE','PROBABILITY'],
});
const C='CANDIDATE_UNDER_POLICY',H='HOLD';
export const M5_LIMITED_CASES=Object.freeze([
  {id:'wood-yang-zi-no-fire',pillars:['庚申','壬子','甲辰','癸酉'],term:'DAXUE',expected:{status:C,eligible:true,elements:['FIRE'],reason:'WINTER_WOOD_WITHOUT_OBSERVED_FIRE_REVIEW_CANDIDATE',fire:[],m4Main:'正印'},reason:'甲木/子水 month, no selected visible or hidden FIRE. The candidate is a warming review, not proven need.'},
  {id:'wood-yin-hai-no-fire',pillars:['辛酉','癸亥','乙丑','壬子'],term:'LIDONG',expected:{status:C,eligible:true,elements:['FIRE'],reason:'WINTER_WOOD_WITHOUT_OBSERVED_FIRE_REVIEW_CANDIDATE',fire:[],m4Main:'正印'},reason:'乙木/亥水 month uses the same narrow purpose without an arbitrary yin-day exception.'},
  {id:'wood-yang-hai-indirect-resource',pillars:['壬申','辛亥','甲子','乙酉'],term:'LIDONG',expected:{status:C,eligible:true,elements:['FIRE'],reason:'WINTER_WOOD_WITHOUT_OBSERVED_FIRE_REVIEW_CANDIDATE',fire:[],m4Main:'偏印'},reason:'Different M4 resource structure does not turn climate purpose into pattern-useful-god selection.'},
  {id:'wood-yin-zi-indirect-resource-no-root',pillars:['癸酉','庚子','乙酉','己丑'],term:'DAXUE',expected:{status:C,eligible:true,elements:['FIRE'],reason:'WINTER_WOOD_WITHOUT_OBSERVED_FIRE_REVIEW_CANDIDATE',fire:[],m4Main:'偏印'},reason:'Absence of hidden wood does not become a whole-chart weak conclusion or a final FIRE recommendation.'},
  {id:'existing-visible-year-fire',pillars:['丙申','壬子','甲辰','癸酉'],term:'DAXUE',expected:{status:H,eligible:true,elements:[],reason:'PRESENT_WARMING_ELEMENT_EFFECT_UNASSESSED',fire:[['year','VISIBLE_STEM','丙']]},reason:'One visible FIRE witness triggers a conservative sufficiency hold, not a claim of excess.'},
  {id:'existing-visible-month-fire',pillars:['庚申','丁亥','乙丑','壬子'],term:'LIDONG',expected:{status:H,eligible:true,elements:[],reason:'PRESENT_WARMING_ELEMENT_EFFECT_UNASSESSED',fire:[['month','VISIBLE_STEM','丁']]},reason:'Month stem FIRE is kept distinct from its water month branch.'},
  {id:'existing-visible-hour-fire',pillars:['庚申','壬子','甲辰','丙子'],term:'DAXUE',expected:{status:H,eligible:true,elements:[],reason:'PRESENT_WARMING_ELEMENT_EFFECT_UNASSESSED',fire:[['hour','VISIBLE_STEM','丙']]},reason:'Changing only the hour stem changes the project adoption guard.'},
  {id:'hidden-year-fire-only',pillars:['庚寅','壬子','甲辰','癸酉'],term:'DAXUE',expected:{status:H,eligible:true,elements:[],reason:'PRESENT_WARMING_ELEMENT_EFFECT_UNASSESSED',fire:[['year','HIDDEN_STEM','丙']]},reason:'A branch with principal WOOD can still contain FIRE; principal-element counts cannot decide absence.'},
  {id:'hidden-day-fire-only',pillars:['庚申','壬子','甲午','癸酉'],term:'DAXUE',expected:{status:H,eligible:true,elements:[],reason:'PRESENT_WARMING_ELEMENT_EFFECT_UNASSESSED',fire:[['day','HIDDEN_STEM','丁']]},reason:'Day-branch hidden members remain eligible witnesses.'},
  {id:'hidden-hour-fire-only',pillars:['庚申','壬子','甲辰','癸巳'],term:'DAXUE',expected:{status:H,eligible:true,elements:[],reason:'PRESENT_WARMING_ELEMENT_EFFECT_UNASSESSED',fire:[['hour','HIDDEN_STEM','丙']]},reason:'Hidden FIRE is not silently discarded because it is not exposed.'},
  {id:'same-winter-metal-day',pillars:['壬申','庚子','庚辰','癸酉'],term:'DAXUE',expected:{status:H,eligible:false,elements:[],reason:'OUTSIDE_WINTER_WOOD_SCOPE',fire:[]},reason:'Winter metal has different textual context and is not generalized from winter wood.'},
  {id:'same-winter-water-day',pillars:['庚申','壬子','壬申','癸酉'],term:'DAXUE',expected:{status:H,eligible:false,elements:[],reason:'OUTSIDE_WINTER_WOOD_SCOPE',fire:[]},reason:'Same month does not automatically yield a universal warming prescription.'},
  {id:'same-winter-earth-day',pillars:['庚申','壬子','戊辰','癸酉'],term:'DAXUE',expected:{status:H,eligible:false,elements:[],reason:'OUTSIDE_WINTER_WOOD_SCOPE',fire:[]},reason:'Later commentary discusses winter earth, but this project does not implement it in v0.1.'},
  {id:'earth-ending-chou-no-fire',pillars:['庚申','癸丑','甲辰','壬子'],term:'XIAOHAN',expected:{status:H,eligible:false,elements:[],reason:'OUTSIDE_WINTER_WOOD_SCOPE',fire:[]},reason:'丑 does not become included merely because one seasonal alternative is winter.'},
  {id:'summer-ending-wei-fire',pillars:['辛酉','乙未','乙丑','壬子'],term:'XIAOSHU',expected:{status:H,eligible:false,elements:[],reason:'OUTSIDE_WINTER_WOOD_SCOPE',fire:[['month','HIDDEN_STEM','丁']]},reason:'Scope exclusion precedes the FIRE guard while all observed witnesses remain available.'},
  {id:'spring-wood-no-fire',pillars:['庚申','辛卯','甲辰','癸酉'],term:'JINGZHE',expected:{status:H,eligible:false,elements:[],reason:'OUTSIDE_WINTER_WOOD_SCOPE',fire:[]},reason:'Spring wood/fire textual discussion is not silently imported.'},
  {id:'summer-wood-existing-fire',pillars:['辛酉','辛巳','乙丑','壬子'],term:'LIXIA',expected:{status:H,eligible:false,elements:[],reason:'OUTSIDE_WINTER_WOOD_SCOPE',fire:[['month','HIDDEN_STEM','丙']]},reason:'Summer wood/water requires a different supported policy, not reversal of the winter lookup.'},
  {id:'repeated-visible-fire-preserve-positions',pillars:['丙申','壬子','甲辰','丙子'],term:'DAXUE',expected:{status:H,eligible:true,elements:[],reason:'PRESENT_WARMING_ELEMENT_EFFECT_UNASSESSED',fire:[['year','VISIBLE_STEM','丙'],['hour','VISIBLE_STEM','丙']]},reason:'Repeated characters are distinct positions; the guard is presence rather than a force score.'},
]);
export const M5_REJECTION_CONTRACTS=Object.freeze([
  'MISSING_EXPLICIT_POLICY','UNSUPPORTED_POLICY','FOREIGN_M2_EXECUTION','SPARSE_INPUT',
  'MISSING_HIDDEN_MEMBER','FOREIGN_SEASONAL_PARENT','FABRICATED_SEASONAL_JUDGMENT','FOREIGN_M4_CONTEXT',
  'MISSING_FACT_REFERENCE','MISSING_SOURCE_REFERENCE','FABRICATED_RESULT','ALTERED_EXPLANATION',
]);
export const M5_BOUNDARY_CONTRACT=Object.freeze({
  inputKind:'SYNTHETIC_CONDITIONAL_PARENTS_NOT_A_REAL_BIRTH',
  parentPillars:[['庚申','庚戌','甲辰','癸酉'],['庚申','辛亥','甲辰','癸酉']],
  terms:['HANLU','LIDONG'],
  expectedStatuses:['HOLD','CANDIDATE_UNDER_POLICY'],
  expectedReasons:['OUTSIDE_WINTER_WOOD_SCOPE','WINTER_WOOD_WITHOUT_OBSERVED_FIRE_REVIEW_CANDIDATE'],
  mustNotInfer:['SELECT_FIRST_PARENT','CARTESIAN_PRODUCT','PROBABILITY','FINAL_USEFUL_GOD'],
});
