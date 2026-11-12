// Authored before the resolver from the owner's explicit A-E decision table.
// Literal software expectations, NOT classical verdicts, birth-calendar or predictive truth.
// Separate AI authorship/review does not constitute an independent human/source certification.
export const RESOURCE_SUPPORT_CASE_BASIS = Object.freeze({
  policyId: 'M3-RESOURCE-ADJACENT-COMBINATION-HOLD-V01',
  expectationMethod: 'LITERAL_OWNER_DECISION_TABLE_MANUAL_CROSSCHECK_NOT_RESOLVER_OUTPUT',
  inputNature: 'SYNTHETIC_FOUR_PILLAR_STRUCTURAL_UNITS_NOT_ASSERTED_REAL_BIRTHS',
  sourceLevel: 'PROJECT_SELECTED_DECISION_TABLE_NOT_A_DIRECT_CLASSICAL_PERSON_CASE',
  roleOrder: ['year','month','day','hour'],
  universallyUnchecked: ['total support efficacy','root force or damage','combination transformation','final strength','fortune or personal events'],
});

export const RESOURCE_SUPPORT_CASES = [
  {
    id:'no-surface-resource', title:'표면 인성 대상 없음', pillars:['丙午','癸巳','丙午','戊午'], monthTerm:'LIXIA',
    expectedParentDecision:'NOT_APPLICABLE', expected:[],
    whyNotOther:'일간 丙의 목 인성 천간이 표면 연·월·시에 없다. 어떤 표면 천간도 임의 인성으로 만들지 않는다.',
    unchecked:['명식 전체의 인성 유무와 생조 전체 효력'],
  },
  {
    id:'hidden-resource-only', title:'장간 인성은 있지만 표면 대상은 없음', pillars:['丙寅','癸巳','丙午','戊午'], monthTerm:'LIXIA',
    expectedParentDecision:'NOT_APPLICABLE', expected:[], expectedHiddenResource:{role:'year',stem:'甲'},
    whyNotOther:'寅의 甲 장간은 기존 M2에 남지만 이번 표면 인성 대상으로 끌어오지 않는다.',
    unchecked:['장간 인성의 실제 작용'],
  },
  {
    id:'no-partner-unrooted', title:'무근 편인이나 표면 합 상대 없음', pillars:['丙午','癸巳','丙午','甲午'], monthTerm:'LIXIA',
    expected:[{resourceRole:'hour',stem:'甲',tenGod:'偏印',rootPresence:'ABSENT_UNDER_POLICY',partnerRoles:[],decision:'NO_HOLD_BY_THIS_RULE',reasonIncludes:['NO_VISIBLE_COMBINATION_PARTNER','RESOURCE_ROOT_ABSENT_UNDER_SELECTED_POLICY']}],
    whyNotOther:'甲의 짝 己가 표면에 없다. 무근만으로 채택 유보하지 않는다.',
    unchecked:['편인의 실제 생조 크기'],
  },
  {
    id:'no-partner-rooted', title:'유근 편인이나 표면 합 상대 없음', pillars:['丙寅','癸巳','丙午','甲午'], monthTerm:'LIXIA',
    expected:[{resourceRole:'hour',stem:'甲',tenGod:'偏印',rootPresence:'PRESENT_UNDER_POLICY',partnerRoles:[],decision:'NO_HOLD_BY_THIS_RULE',reasonIncludes:['NO_VISIBLE_COMBINATION_PARTNER','RESOURCE_ROOT_PRESENT_UNDER_SELECTED_POLICY']}],
    whyNotOther:'寅甲이 자체 근이지만 짝 己가 없다. 유근은 생조 확정 사유도 아니다.',
    unchecked:['근력과 생조 전체 효력'],
  },
  {
    id:'adjacent-unrooted-zhengyin', title:'인접 단일 합·무근 정인', pillars:['戊午','癸巳','甲午','丙寅'], monthTerm:'LIXIA',
    expected:[{resourceRole:'month',stem:'癸',tenGod:'正印',rootPresence:'ABSENT_UNDER_POLICY',partnerRoles:['year'],decision:'SUPPORT_HELD_UNDER_SELECTED_RULE',reasonIncludes:['UNIQUE_ADJACENT_OTHER_STEM_PARTNER','RESOURCE_ROOT_ABSENT_UNDER_SELECTED_POLICY']}],
    whyNotOther:'월간 癸의 유일한 표면 짝은 인접 연간 戊이고 네 지지 장간에 수가 없다.',
    unchecked:['실제 역법상 이 네 기둥의 동시 출생 가능성','합화와 인성의 완전 무효'],
  },
  {
    id:'adjacent-rooted-exact-zhengyin', title:'같은 천간·합 위치에서 정확 수근만 추가', pillars:['戊子','癸巳','甲午','丙寅'], monthTerm:'LIXIA',
    pairedWith:'adjacent-unrooted-zhengyin', onlyPillarBranchChanged:{role:'year',from:'午',to:'子'},
    expected:[{resourceRole:'month',stem:'癸',tenGod:'正印',rootPresence:'PRESENT_UNDER_POLICY',partnerRoles:['year'],decision:'ROOTED_COMBINATION_EFFECT_UNRESOLVED',reasonIncludes:['UNIQUE_ADJACENT_OTHER_STEM_PARTNER','RESOURCE_ROOT_PRESENT_UNDER_SELECTED_POLICY','ROOTED_EXCEPTION_EFFECT_NOT_EVALUATED'],rootMatchTypesInclude:['EXACT_STEM']}],
    whyNotOther:'表面 癸·戊와 위치는 같고 子癸 근만 생긴다. 무근 단일 합의 결론을 그대로 적용하지 않는다.',
    unchecked:['통근 예외가 실제 생조를 얼마나 보존하는가'],
  },
  {
    id:'adjacent-rooted-other-polarity', title:'다른 음양 동오행 근도 같은 통근 예외', pillars:['戊申','癸巳','甲午','丙寅'], monthTerm:'LIXIA',
    pairedWith:'adjacent-unrooted-zhengyin', onlyPillarBranchChanged:{role:'year',from:'午',to:'申'},
    expected:[{resourceRole:'month',stem:'癸',tenGod:'正印',rootPresence:'PRESENT_UNDER_POLICY',partnerRoles:['year'],decision:'ROOTED_COMBINATION_EFFECT_UNRESOLVED',reasonIncludes:['UNIQUE_ADJACENT_OTHER_STEM_PARTNER','RESOURCE_ROOT_PRESENT_UNDER_SELECTED_POLICY','ROOTED_EXCEPTION_EFFECT_NOT_EVALUATED'],rootMatchTypesInclude:['SAME_ELEMENT_DIFFERENT_STEM']}],
    whyNotOther:'申壬은 癸와 다른 천간이지만 승인된 통근 정책의 수근이다. 정확 일치만 예외로 좁히지 않는다.',
    unchecked:['壬根과癸根의 강도 비교'],
  },
  {
    id:'adjacent-unrooted-pianyin', title:'편인도 선택한 생조 채택 범위에 포함', pillars:['丁巳','壬午','甲午','丙寅'], monthTerm:'MANGZHONG',
    expected:[{resourceRole:'month',stem:'壬',tenGod:'偏印',rootPresence:'ABSENT_UNDER_POLICY',partnerRoles:['year'],decision:'SUPPORT_HELD_UNDER_SELECTED_RULE',reasonIncludes:['UNIQUE_ADJACENT_OTHER_STEM_PARTNER','RESOURCE_ROOT_ABSENT_UNDER_SELECTED_POLICY']}],
    whyNotOther:'월간 壬의 유일한 짝 丁은 인접 연간이다. 정인만의 규칙으로 몰래 제한하지 않는다.',
    unchecked:['편인의 다른 전통 작용과 길흉'],
  },
  {
    id:'adjacent-rooted-pianyin', title:'편인 단일 합의 자체 근 예외', pillars:['丁亥','壬午','甲午','丙寅'], monthTerm:'MANGZHONG',
    pairedWith:'adjacent-unrooted-pianyin', onlyPillarBranchChanged:{role:'year',from:'巳',to:'亥'},
    expected:[{resourceRole:'month',stem:'壬',tenGod:'偏印',rootPresence:'PRESENT_UNDER_POLICY',partnerRoles:['year'],decision:'ROOTED_COMBINATION_EFFECT_UNRESOLVED',reasonIncludes:['UNIQUE_ADJACENT_OTHER_STEM_PARTNER','RESOURCE_ROOT_PRESENT_UNDER_SELECTED_POLICY','ROOTED_EXCEPTION_EFFECT_NOT_EVALUATED'],rootMatchTypesInclude:['EXACT_STEM']}],
    whyNotOther:'亥壬을 근으로 가진 壬을 합거·생조 충분 중 어느 쪽으로도 확정하지 않는다.',
    unchecked:['편인의 실제 효력'],
  },
  {
    id:'year-resource-adjacent-month', title:'연간 인성과 월간 짝의 인접성', pillars:['甲午','己巳','丙午','戊午'], monthTerm:'LIXIA',
    expected:[{resourceRole:'year',stem:'甲',tenGod:'偏印',rootPresence:'ABSENT_UNDER_POLICY',partnerRoles:['month'],decision:'SUPPORT_HELD_UNDER_SELECTED_RULE',reasonIncludes:['UNIQUE_ADJACENT_OTHER_STEM_PARTNER','RESOURCE_ROOT_ABSENT_UNDER_SELECTED_POLICY']}],
    whyNotOther:'고정된 연→월→일→시 순서에서 연·월은 인접이다. 화면 표시 방향을 사용하지 않는다.',
    unchecked:['배열 또는 화면 재정렬에 따른 새 해석'],
  },
  {
    id:'remote-unrooted', title:'시간 인성과 연간 짝은 무근이어도 범위 밖', pillars:['己巳','癸巳','丙午','甲午'], monthTerm:'LIXIA',
    expected:[{resourceRole:'hour',stem:'甲',tenGod:'偏印',rootPresence:'ABSENT_UNDER_POLICY',partnerRoles:['year'],decision:'OUT_OF_SCOPE_INTERACTION',reasonIncludes:['REMOTE_OR_SEPARATED_PARTNER','RESOURCE_ROOT_ABSENT_UNDER_SELECTED_POLICY']}],
    whyNotOther:'時甲과年己 사이에 월·일이 있다. 단일 짝·무근만으로 인접 규칙을 적용하지 않는다.',
    unchecked:['원격 합의 실제 효력'],
  },
  {
    id:'remote-rooted', title:'원격과 통근 예외가 겹쳐도 범위 밖 우선', pillars:['己巳','癸亥','丙午','甲午'], monthTerm:'LIDONG',
    expected:[{resourceRole:'hour',stem:'甲',tenGod:'偏印',rootPresence:'PRESENT_UNDER_POLICY',partnerRoles:['year'],decision:'OUT_OF_SCOPE_INTERACTION',reasonIncludes:['REMOTE_OR_SEPARATED_PARTNER','RESOURCE_ROOT_PRESENT_UNDER_SELECTED_POLICY','ROOTED_EXCEPTION_EFFECT_NOT_EVALUATED']}],
    whyNotOther:'亥甲 근은 있지만 원격 조건을 삭제하지 않는다. 통근이 범위 밖 문제를 해결한 것으로 보지 않는다.',
    unchecked:['원격 합·근 예외의 종합 우선순위 이론'],
  },
  {
    id:'multiple-partners-unrooted', title:'인접 상대 외에 원격 상대도 모두 보존', pillars:['戊午','癸巳','甲午','戊午'], monthTerm:'LIXIA',
    expected:[{resourceRole:'month',stem:'癸',tenGod:'正印',rootPresence:'ABSENT_UNDER_POLICY',partnerRoles:['year','hour'],decision:'OUT_OF_SCOPE_INTERACTION',reasonIncludes:['MULTIPLE_VISIBLE_COMBINATION_PARTNERS','REMOTE_OR_SEPARATED_PARTNER','RESOURCE_ROOT_ABSENT_UNDER_SELECTED_POLICY']}],
    whyNotOther:'두 戊 위치는 정상 반복이지 삭제할 중복이 아니다. 첫 인접 戊만 골라 D로 만들지 않는다.',
    unchecked:['쟁합·투합의 종합 효력'],
  },
  {
    id:'multiple-partners-rooted', title:'복수 상대·원격·유근을 함께 보존', pillars:['戊子','癸巳','甲午','戊午'], monthTerm:'LIXIA',
    expected:[{resourceRole:'month',stem:'癸',tenGod:'正印',rootPresence:'PRESENT_UNDER_POLICY',partnerRoles:['year','hour'],decision:'OUT_OF_SCOPE_INTERACTION',reasonIncludes:['MULTIPLE_VISIBLE_COMBINATION_PARTNERS','REMOTE_OR_SEPARATED_PARTNER','RESOURCE_ROOT_PRESENT_UNDER_SELECTED_POLICY','ROOTED_EXCEPTION_EFFECT_NOT_EVALUATED']}],
    whyNotOther:'子癸 근이 있어도 복수 상대를 지우고 E로 좁히지 않는다.',
    unchecked:['복수 합의 실제 생조 손실·보존량'],
  },
  {
    id:'shared-partner-competition', title:'각 인성의 상대는 하나지만 같은 戊를 향해 경쟁', pillars:['戊午','癸巳','甲午','癸巳'], monthTerm:'LIXIA',
    expected:[
      {resourceRole:'month',stem:'癸',tenGod:'正印',rootPresence:'ABSENT_UNDER_POLICY',partnerRoles:['year'],decision:'OUT_OF_SCOPE_INTERACTION',reasonIncludes:['COMPETING_SURFACE_RESOURCES','RESOURCE_ROOT_ABSENT_UNDER_SELECTED_POLICY']},
      {resourceRole:'hour',stem:'癸',tenGod:'正印',rootPresence:'ABSENT_UNDER_POLICY',partnerRoles:['year'],decision:'OUT_OF_SCOPE_INTERACTION',reasonIncludes:['COMPETING_SURFACE_RESOURCES','REMOTE_OR_SEPARATED_PARTNER','RESOURCE_ROOT_ABSENT_UNDER_SELECTED_POLICY']},
    ],
    whyNotOther:'월癸와시癸는 별도 표면 위치다. 각자의 partnerCount=1만 보고 월癸를 단독 인접 합으로 고르지 않는다.',
    unchecked:['같은 짝을 향하는 경쟁의 승패'],
  },
  {
    id:'two-resources-different-decisions', title:'정인·편인이 서로 다른 결정을 갖는 부모', pillars:['丁巳','壬午','甲午','癸巳'], monthTerm:'MANGZHONG',
    expected:[
      {resourceRole:'month',stem:'壬',tenGod:'偏印',rootPresence:'ABSENT_UNDER_POLICY',partnerRoles:['year'],decision:'SUPPORT_HELD_UNDER_SELECTED_RULE',reasonIncludes:['UNIQUE_ADJACENT_OTHER_STEM_PARTNER','RESOURCE_ROOT_ABSENT_UNDER_SELECTED_POLICY']},
      {resourceRole:'hour',stem:'癸',tenGod:'正印',rootPresence:'ABSENT_UNDER_POLICY',partnerRoles:[],decision:'NO_HOLD_BY_THIS_RULE',reasonIncludes:['NO_VISIBLE_COMBINATION_PARTNER','RESOURCE_ROOT_ABSENT_UNDER_SELECTED_POLICY']},
    ],
    whyNotOther:'壬은 丁과 합 짝이지만 癸의 짝 戊는 없다. 한 인성의 결정을 다른 인성에 복사하지 않는다.',
    unchecked:['두 인성의 종합 생조 총량'],
  },
  {
    id:'parallel-seasonal-alternatives', title:'계절 대안은 같은 원국의 합 결정을 늘리지 않음', pillars:['戊午','癸巳','甲午','丙寅'], monthTerm:'LIXIA',
    parallelContext:{kind:'SYNTHETIC_PARALLEL_SEASONAL_ALTERNATIVES_NOT_A_CLAIMED_BIRTH_MINUTE',alternatives:['SPRING','EARTH_DOMINANT']},
    expectedSameResourceDecisionAs:'adjacent-unrooted-zhengyin',
    expected:[{resourceRole:'month',stem:'癸',tenGod:'正印',rootPresence:'ABSENT_UNDER_POLICY',partnerRoles:['year'],decision:'SUPPORT_HELD_UNDER_SELECTED_RULE',reasonIncludes:['UNIQUE_ADJACENT_OTHER_STEM_PARTNER','RESOURCE_ROOT_ABSENT_UNDER_SELECTED_POLICY']}],
    whyNotOther:'계절 대안 메타데이터는 천간·위치·근의 입력을 바꾸지 않는다. 실제 B시각의 연결은 별도 어댑터 검사다.',
    unchecked:['이 합성 문맥이 실제 B경계 명식이라는 주장'],
  },
  {
    id:'reject-cross-candidate-root', title:'다른 후보의 통근 결과 혼입 거절', pillars:['戊午','癸巳','甲午','丙寅'], monthTerm:'LIXIA',
    secondPillars:['戊子','癸巳','甲午','丙寅'], secondMonthTerm:'LIXIA',
    invalidMutation:{kind:'CROSS_CANDIDATE_ROOT_TARGET',resourceRole:'month',fromCandidate:1,toCandidate:0},expectedRejection:true,
    whyNotOther:'후보1의 癸 유근을 후보0의 무근에 대입해 예외 결론을 만들면 안 된다.',
    unchecked:['조합을 실제 동일 출생분의 상관 후보라고 주장하지 않음'],
  },
  {
    id:'reject-missing-resource-root', title:'필수 통근 자료 누락은 무근으로 채우지 않음', pillars:['戊午','癸巳','甲午','丙寅'], monthTerm:'LIXIA',
    invalidMutation:{kind:'OMIT_RESOURCE_ROOT_TARGET',resourceRole:'month'},expectedRejection:true,
    whyNotOther:'기존 발급 root target이 없으면 입력/문맥 오류다. ABSENT를 생성해 D로 진행하지 않는다.',
    unchecked:['부분 자료에서 근을 추정하지 않음'],
  },
  {
    id:'reject-day-as-resource-combination', title:'유효 인성 조건에서 도달할 수 없는 본신 합 조작 거절', pillars:['戊午','癸巳','甲午','丙寅'], monthTerm:'LIXIA',
    invalidMutation:{kind:'FORGE_DAY_AS_RESOURCE_OR_RESOURCE_PARTNER',resourceRole:'month',partnerRole:'day'},expectedRejection:true,
    whyNotOther:'정당한 일간 기준 인성과 일간 자체는 오합 짝이 될 수 없다. 문헌의 본신 합 논의를 허구의 인성 입력으로 만들지 않는다.',
    unchecked:['일반 천간의 본신 합 이론 전체'],
  },
];

function freeze(value){if(value&&typeof value==='object'){for(const member of Object.values(value))freeze(member);Object.freeze(value);}return value;}
freeze(RESOURCE_SUPPORT_CASES);
