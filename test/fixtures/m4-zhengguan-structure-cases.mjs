// Literal contracts written before the M4 resolver. No resolver output is imported.
// The classical examples retain their transcribed four pillars, not invented birthdays.
// Synthetic four-pillar units are not assertions of calendrical birth feasibility.
export const M4_ZHENGGUAN_CASE_BASIS = {
  profileId: 'M4-ZHENGGUAN-MONTH-STRUCTURE-V01', version: '0.1.0',
  expectationMethod: 'LITERAL_POLICY_TABLE_AND_MANUAL_EXISTING_M2_TABLE_CROSSCHECK_BEFORE_RESOLVER',
  hiddenStemPolicyId: 'M2-HIDDEN-STEMS-CLASSIC-MEMBERS-MAINQI-V1',
  sourceLevel: 'PUBLIC_TRANSCRIPTION_AND_PROJECT_POLICY_NOT_SCAN_OR_HUMAN_EXPERT_CERTIFICATION',
  directBirthFeasibilityCheckedForSyntheticUnits: false,
  candidateRules: [
    'MONTH_MAIN_QI_ZHENGGUAN_IS_A_STRUCTURAL_CANDIDATE_WITH_OR_WITHOUT_EXACT_EXPOSURE',
    'MONTH_OTHER_ZHENGGUAN_REQUIRES_THE_SAME_CHARACTER_AT_A_VISIBLE_NATAL_POSITION',
    'OTHER_MONTH_MEMBER_VISIBLE_OUTSIDE_DAY_IS_A_SELECTION_COMPETITION_NOT_AUTOMATIC_DISQUALIFICATION',
    'DAY_MASTER_ONLY_EXACT_MATCH_IS_RECORDED_BUT_NOT_A_COMPETING_PATTERN',
    'WU_BRANCH_OTHER_HIDDEN_OFFICER_REMAINS_SOURCE_POLICY_UNRESOLVED',
  ],
  universalMustNotInfer: ['GE_CHENG', 'GE_BAI', 'JIU_YING_EFFECT_CONFIRMED', 'HELPFUL_YONGSHEN', 'STRONG_OR_WEAK_FROM_PATTERN', 'COMBINATION_TRANSFORMATION', 'FORTUNE_OR_EVENTS'],
  upstreamFinalStrength: 'NOT_IMPLEMENTED',
};

export const M4_ZHENGGUAN_CASES = [
  {
    id: 'literature-xue-main-geng-not-visible', kind: 'LITERATURE_TRANSCRIBED_FOUR_PILLARS_NOT_BIRTH_DATE',
    pillars: ['甲申','壬申','乙巳','戊寅'], monthTerm: 'LIQIU',
    expected: { candidateStatus: 'STRUCTURAL_CANDIDATE', candidateBasis: 'MAIN_QI_ZHENGGUAN', monthBranch: '申', mainStem: '庚', mainTenGod: '正官', monthOfficers: [{stem:'庚',position:'MAIN_QI'}], officerExposure: [], competitionPresent: true, competingExposure: [{role:'month',stem:'壬'},{role:'hour',stem:'戊'}], groups: {visibleWealth:[{role:'hour',stem:'戊',tenGod:'正財'}],visibleResource:[{role:'month',stem:'壬',tenGod:'正印'}]}, finalEffects:'NOT_IMPLEMENTED' },
    sourceRef: ['M4-ZPZQ-ORIGINAL-ZHENGGUAN-NCC','M4-ZPZQ-XU-COMMENTARY-NCC'], policyRef:'M4-ZHENGGUAN-MONTH-STRUCTURE-V01',
    mustNotInfer:['MAIN_OFFICER_MUST_BE_VISIBLE','WEALTH_AND_RESOURCE_PROVE_GE_CHENG','RECONSTRUCT_GREGORIAN_BIRTH'],
    reason:'The transcribed 薛 example has 乙 day and 申 month. Existing M2 names 庚 MAIN_QI and 正官; 庚 is not a visible stem. 壬 and 戊 are separately exposed month members, not grounds to erase the officer candidate.',
  },
  {
    id:'literature-xuan-wei-main-ji-exposed',kind:'LITERATURE_TRANSCRIBED_FOUR_PILLARS_NOT_BIRTH_DATE',
    pillars:['己卯','辛未','壬寅','辛亥'],monthTerm:'XIAOSHU',
    expected:{candidateStatus:'STRUCTURAL_CANDIDATE',candidateBasis:'MAIN_QI_ZHENGGUAN',monthBranch:'未',mainStem:'己',mainTenGod:'正官',monthOfficers:[{stem:'己',position:'MAIN_QI'}],officerExposure:[{role:'year',stem:'己'}],competitionPresent:false,competingExposure:[],groups:{visibleResource:[{role:'month',stem:'辛',tenGod:'正印'},{role:'hour',stem:'辛',tenGod:'正印'}]},finalEffects:'NOT_IMPLEMENTED'},
    sourceRef:['M4-ZPZQ-ORIGINAL-ZHENGGUAN-NCC','M4-ZPZQ-XU-COMMENTARY-NCC'],policyRef:'M4-ZHENGGUAN-MONTH-STRUCTURE-V01',
    mustNotInfer:['ZA_QI_MEANS_M2_OTHER','RESOURCE_AUTOMATICALLY_RESCUES','GE_CHENG_CONFIRMED'],
    reason:'The 宣 example is 壬 day/未 month. The approved M2 row is 己丁乙, so 己官 is MAIN_QI, even if a textual discussion uses 雜氣 or another month-governing context.',
  },
  {
    id:'literature-li-visible-killing-is-not-officer',kind:'LITERATURE_TRANSCRIBED_FOUR_PILLARS_NOT_BIRTH_DATE',
    pillars:['庚寅','乙酉','甲子','戊辰'],monthTerm:'BAILU',
    expected:{candidateStatus:'STRUCTURAL_CANDIDATE',candidateBasis:'MAIN_QI_ZHENGGUAN',monthBranch:'酉',mainStem:'辛',mainTenGod:'正官',monthOfficers:[{stem:'辛',position:'MAIN_QI'}],officerExposure:[],competitionPresent:false,competingExposure:[],groups:{visibleSevenKillings:[{role:'year',stem:'庚',tenGod:'七殺'}],visibleWealth:[{role:'hour',stem:'戊',tenGod:'偏財'}]},finalEffects:'NOT_IMPLEMENTED'},
    sourceRef:['M4-ZPZQ-ORIGINAL-ZHENGGUAN-NCC','M4-ZPZQ-XU-COMMENTARY-NCC'],policyRef:'M4-ZHENGGUAN-MONTH-STRUCTURE-V01',
    mustNotInfer:['GENG_IS_JIA_OFFICER','OFFICER_KILLING_COEXISTENCE_AUTOMATIC_FAILURE','YI_GENG_COMBINATION_ERASES_GENG'],
    reason:'For 甲 the month 辛 is 正官 and the visible year 庚 is 七殺. The year 庚/month 乙 pair is preserved as a pair, not an effect or removal decision.',
  },
  {
    id:'literature-jin-original-commentary-scope-dispute',kind:'LITERATURE_TRANSCRIBED_FOUR_PILLARS_NOT_BIRTH_DATE',
    pillars:['乙卯','丁亥','丁未','庚戌'],monthTerm:'LIDONG',
    expected:{candidateStatus:'STRUCTURAL_CANDIDATE',candidateBasis:'MAIN_QI_ZHENGGUAN',monthBranch:'亥',mainStem:'壬',mainTenGod:'正官',monthOfficers:[{stem:'壬',position:'MAIN_QI'}],officerExposure:[],competitionPresent:false,competingExposure:[],groups:{visibleResource:[{role:'year',stem:'乙',tenGod:'偏印'}],visibleWealth:[{role:'hour',stem:'庚',tenGod:'正財'}]},finalEffects:'NOT_IMPLEMENTED'},
    sourceRef:['M4-ZPZQ-ORIGINAL-ZHENGGUAN-NCC','M4-ZPZQ-XU-COMMENTARY-NCC'],policyRef:'M4-ZHENGGUAN-MONTH-STRUCTURE-V01',
    mustNotInfer:['SAME_ELEMENT_YI_IS_EXACT_JIA_EXPOSURE','COMMENTARY_DISPUTE_DISAPPEARS','PROJECT_CANDIDATE_CERTIFIES_ORIGINAL_FINAL_INTERPRETATION'],
    reason:'The 金 example has 丁 day/亥 month and MAIN_QI 壬官. Year 乙 resource is not the same character as hidden 甲. The commentary discussion does not become a chart-string exception or a final success claim.',
  },
  {
    id:'literature-fan-yin-jia-is-main-not-other',kind:'LITERATURE_TRANSCRIBED_FOUR_PILLARS_NOT_BIRTH_DATE',
    pillars:['丁丑','壬寅','己巳','丙寅'],monthTerm:'LICHUN',
    expected:{candidateStatus:'STRUCTURAL_CANDIDATE',candidateBasis:'MAIN_QI_ZHENGGUAN',monthBranch:'寅',mainStem:'甲',mainTenGod:'正官',monthOfficers:[{stem:'甲',position:'MAIN_QI'}],officerExposure:[],competitionPresent:true,competingExposure:[{role:'hour',stem:'丙'}],groups:{visibleResource:[{role:'year',stem:'丁',tenGod:'偏印'},{role:'hour',stem:'丙',tenGod:'正印'}],visibleWealth:[{role:'month',stem:'壬',tenGod:'正財'}]},finalEffects:'NOT_IMPLEMENTED'},
    sourceRef:['M4-ZPZQ-ORIGINAL-ZHENGGUAN-NCC','M4-ZPZQ-XU-COMMENTARY-NCC'],policyRef:'M4-ZHENGGUAN-MONTH-STRUCTURE-V01',
    mustNotInfer:['YIN_JIA_IS_M2_OTHER','EXPOSED_RESOURCE_ERASES_MONTH_OFFICER','RESOURCE_IS_EFFECTIVE_RESCUE'],
    reason:'The 范 example preserves the M2 寅 row 甲丙戊: 甲官 is MAIN_QI, while hour 丙 is a different exposed month member. Neither the display table nor this competition is a force ranking.',
  },
  {
    id:'main-officer-hidden-without-visible-officer',kind:'SYNTHETIC_STRUCTURAL_UNIT',pillars:['甲子','乙酉','甲午','壬申'],monthTerm:'BAILU',
    expected:{candidateStatus:'STRUCTURAL_CANDIDATE',candidateBasis:'MAIN_QI_ZHENGGUAN',monthBranch:'酉',mainStem:'辛',mainTenGod:'正官',monthOfficers:[{stem:'辛',position:'MAIN_QI'}],officerExposure:[],competitionPresent:false,competingExposure:[],visibleOfficerAbsent:true,finalEffects:'NOT_IMPLEMENTED'},
    sourceRef:['M4-PROJECT-ZHENGGUAN-STRUCTURE-V01'],policyRef:'M4-ZHENGGUAN-MONTH-STRUCTURE-V01',mustNotInfer:['VISIBLE_OFFICER_REQUIRED','HIDDEN_OFFICER_IS_EFFECTIVE'],
    reason:'A valid MAIN_QI officer candidate is not conditional on a visible 辛. The absence of a visible officer must not be called total officer absence.',
  },
  {
    id:'main-officer-exact-year-exposure',kind:'SYNTHETIC_STRUCTURAL_UNIT',pillars:['辛亥','乙酉','甲午','壬申'],monthTerm:'BAILU',
    expected:{candidateStatus:'STRUCTURAL_CANDIDATE',candidateBasis:'MAIN_QI_ZHENGGUAN',monthBranch:'酉',mainStem:'辛',mainTenGod:'正官',monthOfficers:[{stem:'辛',position:'MAIN_QI'}],officerExposure:[{role:'year',stem:'辛'}],competitionPresent:false,competingExposure:[],groups:{visibleResource:[{role:'hour',stem:'壬',tenGod:'偏印'}]},finalEffects:'NOT_IMPLEMENTED'},
    sourceRef:['M4-PROJECT-ZHENGGUAN-STRUCTURE-V01'],policyRef:'M4-ZHENGGUAN-MONTH-STRUCTURE-V01',mustNotInfer:['EXPOSURE_PROVES_GE_CHENG','RESOURCE_PROVES_JIU_YING'],
    reason:'The year 辛 is exactly the month officer character. Exposure is a location link, not a claim that the officer or resource has sufficient force.',
  },
  {
    id:'visible-officer-outside-month-no-candidate',kind:'SYNTHETIC_STRUCTURAL_UNIT',pillars:['辛酉','乙卯','甲午','壬申'],monthTerm:'JINGZHE',
    expected:{candidateStatus:'NOT_A_CANDIDATE_UNDER_POLICY',candidateBasis:'NO_MONTH_ZHENGGUAN',monthBranch:'卯',mainStem:'乙',mainTenGod:'劫財',monthOfficers:[],officerExposure:[],competitionPresent:false,competingExposure:[],groups:{visibleOfficer:[{role:'year',stem:'辛',tenGod:'正官'}]},finalEffects:'NOT_IMPLEMENTED'},
    sourceRef:['M4-PROJECT-ZHENGGUAN-STRUCTURE-V01'],policyRef:'M4-ZHENGGUAN-MONTH-STRUCTURE-V01',mustNotInfer:['VISIBLE_OFFICER_MEANS_OFFICER_PATTERN','TOTAL_OFFICER_ABSENT'],
    reason:'Year 辛 and year 酉 preserve officer existence, but month 卯 contains only 乙. Compare the branch-swap case without changing the four surface stems.',
  },
  {
    id:'hidden-officer-only-outside-month',kind:'SYNTHETIC_STRUCTURAL_UNIT',pillars:['乙酉','丙寅','甲午','壬申'],monthTerm:'LICHUN',
    expected:{candidateStatus:'NOT_A_CANDIDATE_UNDER_POLICY',candidateBasis:'NO_MONTH_ZHENGGUAN',monthBranch:'寅',mainStem:'甲',mainTenGod:'比肩',monthOfficers:[],officerExposure:[],competitionPresent:false,competingExposure:[],visibleOfficerAbsent:true,hiddenOfficerIncludes:[{role:'year',branch:'酉',stem:'辛'}],finalEffects:'NOT_IMPLEMENTED'},
    sourceRef:['M4-PROJECT-ZHENGGUAN-STRUCTURE-V01'],policyRef:'M4-ZHENGGUAN-MONTH-STRUCTURE-V01',mustNotInfer:['NO_VISIBLE_OFFICER_MEANS_NO_OFFICER','YEAR_HIDDEN_OFFICER_IS_MONTH_BASIS'],
    reason:'Year hidden 辛 exists, but the actual month 寅 has no 正官 for 甲. Surface absence and total absence remain separate.',
  },
  {
    id:'seven-killings-month-is-not-officer',kind:'SYNTHETIC_STRUCTURAL_UNIT',pillars:['甲子','丙申','甲午','壬申'],monthTerm:'LIQIU',
    expected:{candidateStatus:'NOT_A_CANDIDATE_UNDER_POLICY',candidateBasis:'NO_MONTH_ZHENGGUAN',monthBranch:'申',mainStem:'庚',mainTenGod:'七殺',monthOfficers:[],officerExposure:[],competitionPresent:false,competingExposure:[],allOfficerAbsent:true,hiddenSevenKillingsIncludes:[{role:'month',branch:'申',stem:'庚'}],finalEffects:'NOT_IMPLEMENTED'},
    sourceRef:['M4-PROJECT-ZHENGGUAN-STRUCTURE-V01'],policyRef:'M4-ZHENGGUAN-MONTH-STRUCTURE-V01',mustNotInfer:['METAL_CONTROL_ALWAYS_ZHENGGUAN','QISHA_IS_ZHENGGUAN_PATTERN'],
    reason:'For 甲, same-polarity 庚 is 七殺. An actual controlling element does not justify replacing the M2 ten-god classification.',
  },
  {
    id:'other-officer-not-exposed-not-selected',kind:'SYNTHETIC_STRUCTURAL_UNIT',pillars:['甲子','乙丑','甲午','丙寅'],monthTerm:'XIAOHAN',
    expected:{candidateStatus:'NOT_A_CANDIDATE_UNDER_POLICY',candidateBasis:'OTHER_ZHENGGUAN_NOT_EXPOSED',monthBranch:'丑',mainStem:'己',mainTenGod:'正財',monthOfficers:[{stem:'辛',position:'OTHER'}],officerExposure:[],competitionPresent:false,competingExposure:[],finalEffects:'NOT_IMPLEMENTED'},
    sourceRef:['M4-ZPZQ-ORIGINAL-BIANHUA-NCC','M4-PROJECT-ZHENGGUAN-STRUCTURE-V01'],policyRef:'M4-ZHENGGUAN-MONTH-STRUCTURE-V01',mustNotInfer:['HIDDEN_OFFICER_DELETED','OTHER_MEMBERS_ARE_ZERO_FORCE','NO_OTHER_SCHOOL_COULD_SELECT_IT'],
    reason:'The narrow policy does not select an unexposed OTHER officer. Hidden 辛 remains real; month governing-day and other transformation choices are not silently supplied.',
  },
  {
    id:'other-officer-exact-year-exposure-selected',kind:'SYNTHETIC_STRUCTURAL_UNIT',pillars:['辛亥','乙丑','甲午','丙寅'],monthTerm:'XIAOHAN',
    expected:{candidateStatus:'STRUCTURAL_CANDIDATE',candidateBasis:'OTHER_ZHENGGUAN_EXACTLY_EXPOSED',monthBranch:'丑',mainStem:'己',mainTenGod:'正財',monthOfficers:[{stem:'辛',position:'OTHER'}],officerExposure:[{role:'year',stem:'辛'}],competitionPresent:false,competingExposure:[],finalEffects:'NOT_IMPLEMENTED'},
    sourceRef:['M4-ZPZQ-ORIGINAL-BIANHUA-NCC','M4-PROJECT-ZHENGGUAN-STRUCTURE-V01'],policyRef:'M4-ZHENGGUAN-MONTH-STRUCTURE-V01',mustNotInfer:['OTHER_IS_AUTO_WEAKER','EXPOSURE_CONFIRMS_GE_CHENG'],
    reason:'Exactly visible 辛 closes the selected OTHER exposure condition. No visible 己 or 癸 competes as a different month member.',
  },
  {
    id:'other-officer-same-element-wrong-stem-not-exposure',kind:'SYNTHETIC_STRUCTURAL_UNIT',pillars:['庚申','乙丑','甲午','丙寅'],monthTerm:'XIAOHAN',
    expected:{candidateStatus:'NOT_A_CANDIDATE_UNDER_POLICY',candidateBasis:'OTHER_ZHENGGUAN_NOT_EXPOSED',monthBranch:'丑',mainStem:'己',mainTenGod:'正財',monthOfficers:[{stem:'辛',position:'OTHER'}],officerExposure:[],competitionPresent:false,competingExposure:[],groups:{visibleSevenKillings:[{role:'year',stem:'庚',tenGod:'七殺'}]},finalEffects:'NOT_IMPLEMENTED'},
    sourceRef:['M4-PROJECT-ZHENGGUAN-STRUCTURE-V01'],policyRef:'M4-ZHENGGUAN-MONTH-STRUCTURE-V01',mustNotInfer:['GENG_EXPOSES_HIDDEN_XIN','SAME_ELEMENT_IS_EXACT_EXPOSURE'],
    reason:'Visible 庚 is the same element but a different character and ten god. It cannot serve as the required exact 辛 exposure.',
  },
  {
    id:'other-officer-resource-month-member-competition',kind:'SYNTHETIC_STRUCTURAL_UNIT',pillars:['辛亥','癸丑','甲午','丙寅'],monthTerm:'XIAOHAN',
    expected:{candidateStatus:'STRUCTURAL_CANDIDATE',candidateBasis:'OTHER_ZHENGGUAN_EXACTLY_EXPOSED',monthBranch:'丑',mainStem:'己',mainTenGod:'正財',monthOfficers:[{stem:'辛',position:'OTHER'}],officerExposure:[{role:'year',stem:'辛'}],competitionPresent:true,competingExposure:[{role:'month',stem:'癸'}],groups:{visibleResource:[{role:'month',stem:'癸',tenGod:'正印'}]},finalEffects:'NOT_IMPLEMENTED'},
    sourceRef:['M4-ZPZQ-ORIGINAL-BIANHUA-NCC','M4-PROJECT-ZHENGGUAN-STRUCTURE-V01'],policyRef:'M4-ZHENGGUAN-MONTH-STRUCTURE-V01',mustNotInfer:['MULTIPLE_EXPOSURE_ERASES_OFFICER_CANDIDATE','RESOURCE_AUTO_RESCUE','EXCLUSIVE_PATTERN_SELECTED'],
    reason:'Officer 辛 and resource 癸 are both actual month members with different visible positions. The candidate survives and exclusive selection remains unresolved.',
  },
  {
    id:'other-officer-main-wealth-competition',kind:'SYNTHETIC_STRUCTURAL_UNIT',pillars:['辛亥','己丑','甲午','丙寅'],monthTerm:'XIAOHAN',
    expected:{candidateStatus:'STRUCTURAL_CANDIDATE',candidateBasis:'OTHER_ZHENGGUAN_EXACTLY_EXPOSED',monthBranch:'丑',mainStem:'己',mainTenGod:'正財',monthOfficers:[{stem:'辛',position:'OTHER'}],officerExposure:[{role:'year',stem:'辛'}],competitionPresent:true,competingExposure:[{role:'month',stem:'己'}],groups:{visibleWealth:[{role:'month',stem:'己',tenGod:'正財'}]},finalEffects:'NOT_IMPLEMENTED'},
    sourceRef:['M4-ZPZQ-ORIGINAL-BIANHUA-NCC','M4-PROJECT-ZHENGGUAN-STRUCTURE-V01'],policyRef:'M4-ZHENGGUAN-MONTH-STRUCTURE-V01',mustNotInfer:['MAIN_DISPLAY_ORDER_AUTOMATICALLY_WINS','WEALTH_AUTO_FORMS_OFFICER_PATTERN'],
    reason:'Main member 己 exposure is not silently deleted or used as a force weight. Both the selected officer candidate and the competing month-member context remain.',
  },
  {
    id:'synthetic-completion-of-partial-xin-yin-bing-passage',kind:'SYNTHETIC_STRUCTURAL_UNIT_NOT_COMPLETE_TEXTUAL_EXAMPLE',pillars:['丙子','壬寅','辛酉','癸巳'],monthTerm:'LICHUN',
    expected:{candidateStatus:'STRUCTURAL_CANDIDATE',candidateBasis:'OTHER_ZHENGGUAN_EXACTLY_EXPOSED',monthBranch:'寅',mainStem:'甲',mainTenGod:'正財',monthOfficers:[{stem:'丙',position:'OTHER'}],officerExposure:[{role:'year',stem:'丙'}],competitionPresent:false,competingExposure:[],groups:{visibleHurtingOfficer:[{role:'month',stem:'壬',tenGod:'傷官'}]},finalEffects:'NOT_IMPLEMENTED'},
    sourceRef:['M4-ZPZQ-ORIGINAL-BIANHUA-NCC','M4-PROJECT-ZHENGGUAN-STRUCTURE-V01'],policyRef:'M4-ZHENGGUAN-MONTH-STRUCTURE-V01',mustNotInfer:['TEXT_CONTAINS_THESE_FOUR_PILLARS','HURTING_OFFICER_AUTO_BREAKS_PATTERN','SYNTHETIC_BIRTH_DATE_EXISTS'],
    reason:'The text supplies the partial 辛 day/寅 month/丙 exposure context. These four pillars are a declared synthetic completion, not invented missing classical birth data.',
  },
  {
    id:'main-officer-and-visible-seven-killings',kind:'SYNTHETIC_STRUCTURAL_UNIT',pillars:['庚申','乙酉','甲午','辛未'],monthTerm:'BAILU',
    expected:{candidateStatus:'STRUCTURAL_CANDIDATE',candidateBasis:'MAIN_QI_ZHENGGUAN',monthBranch:'酉',mainStem:'辛',mainTenGod:'正官',monthOfficers:[{stem:'辛',position:'MAIN_QI'}],officerExposure:[{role:'hour',stem:'辛'}],competitionPresent:false,competingExposure:[],groups:{visibleOfficer:[{role:'hour',stem:'辛',tenGod:'正官'}],visibleSevenKillings:[{role:'year',stem:'庚',tenGod:'七殺'}]},finalEffects:'NOT_IMPLEMENTED'},
    sourceRef:['M4-ZPZQ-ORIGINAL-CHENGBAI-NCC','M4-PROJECT-ZHENGGUAN-STRUCTURE-V01'],policyRef:'M4-ZHENGGUAN-MONTH-STRUCTURE-V01',mustNotInfer:['GUANSHA_COEXISTENCE_IS_CONFIRMED_FAILURE','KILLING_IS_REMOVED_TO_MAKE_PURE_OFFICER'],
    reason:'Opposite-polarity 辛官 and same-polarity 庚殺 keep distinct positions and do not become a final 混雜 effect judgment.',
  },
  {
    id:'wealth-resource-adjacent-year-month',kind:'SYNTHETIC_STRUCTURAL_UNIT',pillars:['戊午','癸酉','甲午','丙寅'],monthTerm:'BAILU',
    expected:{candidateStatus:'STRUCTURAL_CANDIDATE',candidateBasis:'MAIN_QI_ZHENGGUAN',monthBranch:'酉',mainStem:'辛',mainTenGod:'正官',monthOfficers:[{stem:'辛',position:'MAIN_QI'}],officerExposure:[],competitionPresent:false,competingExposure:[],groups:{visibleWealth:[{role:'year',stem:'戊',tenGod:'偏財'}],visibleResource:[{role:'month',stem:'癸',tenGod:'正印'}]},wealthResourcePairsInclude:[{wealthRole:'year',wealthStem:'戊',resourceRole:'month',resourceStem:'癸',adjacent:true}],finalEffects:'NOT_IMPLEMENTED'},
    sourceRef:['M4-ZPZQ-ORIGINAL-ZHENGGUAN-NCC','M4-PROJECT-ZHENGGUAN-STRUCTURE-V01'],policyRef:'M4-ZHENGGUAN-MONTH-STRUCTURE-V01',mustNotInfer:['WEALTH_RESOURCE_EXISTENCE_IS_BOTH_EFFECTIVE','WU_GUI_PAIR_AUTOMATICALLY_REMOVES_RESOURCE'],
    reason:'財 and 印 locations are recorded as year/month adjacent. The same visible 戊癸 pair is not an automatic 合去 or rescue decision.',
  },
  {
    id:'wealth-resource-separated-year-hour-and-adjacent-month',kind:'SYNTHETIC_STRUCTURAL_UNIT',pillars:['癸亥','己酉','甲午','戊辰'],monthTerm:'BAILU',
    expected:{candidateStatus:'STRUCTURAL_CANDIDATE',candidateBasis:'MAIN_QI_ZHENGGUAN',monthBranch:'酉',mainStem:'辛',mainTenGod:'正官',monthOfficers:[{stem:'辛',position:'MAIN_QI'}],officerExposure:[],competitionPresent:false,competingExposure:[],groups:{visibleWealth:[{role:'month',stem:'己',tenGod:'正財'},{role:'hour',stem:'戊',tenGod:'偏財'}],visibleResource:[{role:'year',stem:'癸',tenGod:'正印'}]},wealthResourcePairsInclude:[{wealthRole:'month',wealthStem:'己',resourceRole:'year',resourceStem:'癸',adjacent:true},{wealthRole:'hour',wealthStem:'戊',resourceRole:'year',resourceStem:'癸',adjacent:false}],finalEffects:'NOT_IMPLEMENTED'},
    sourceRef:['M4-ZPZQ-ORIGINAL-ZHENGGUAN-NCC','M4-PROJECT-ZHENGGUAN-STRUCTURE-V01'],policyRef:'M4-ZHENGGUAN-MONTH-STRUCTURE-V01',mustNotInfer:['ALL_WEALTH_RESOURCE_POSITIONS_ARE_EQUIVALENT','SAME_ELEMENT_COUNT_IMPLIES_SAME_EFFECT'],
    reason:'Different 財 positions keep two separate links to the resource. Neither distance nor mere coexistence is promoted to complete interaction efficacy.',
  },
  {
    id:'visible-hurting-officer-with-month-officer',kind:'SYNTHETIC_STRUCTURAL_UNIT',pillars:['丁卯','乙酉','甲午','壬申'],monthTerm:'BAILU',
    expected:{candidateStatus:'STRUCTURAL_CANDIDATE',candidateBasis:'MAIN_QI_ZHENGGUAN',monthBranch:'酉',mainStem:'辛',mainTenGod:'正官',monthOfficers:[{stem:'辛',position:'MAIN_QI'}],officerExposure:[],competitionPresent:false,competingExposure:[],groups:{visibleHurtingOfficer:[{role:'year',stem:'丁',tenGod:'傷官'}]},relationsInclude:[{leftRole:'year',rightRole:'month',kinds:['LIUCHONG']}],finalEffects:'NOT_IMPLEMENTED'},
    sourceRef:['M4-ZPZQ-ORIGINAL-CHENGBAI-NCC','M4-PROJECT-ZHENGGUAN-STRUCTURE-V01'],policyRef:'M4-ZHENGGUAN-MONTH-STRUCTURE-V01',mustNotInfer:['HURTING_OFFICER_AUTO_GE_BAI','MAO_YOU_CHONG_AUTO_DESTROYS_CANDIDATE'],
    reason:'丁傷官 and month 辛官 create a control-structure review, while 卯酉沖 is independently retained. Neither observation is a final destruction decision.',
  },
  {
    id:'visible-officer-in-five-combination',kind:'SYNTHETIC_STRUCTURAL_UNIT',pillars:['辛亥','乙酉','甲午','丙寅'],monthTerm:'BAILU',
    expected:{candidateStatus:'STRUCTURAL_CANDIDATE',candidateBasis:'MAIN_QI_ZHENGGUAN',monthBranch:'酉',mainStem:'辛',mainTenGod:'正官',monthOfficers:[{stem:'辛',position:'MAIN_QI'}],officerExposure:[{role:'year',stem:'辛'}],competitionPresent:false,competingExposure:[],officerCombinationPairs:[{leftRole:'year',leftStem:'辛',rightRole:'hour',rightStem:'丙',adjacent:false}],finalEffects:'NOT_IMPLEMENTED'},
    sourceRef:['M4-ZPZQ-ORIGINAL-ZHENGGUAN-NCC','M4-PROJECT-ZHENGGUAN-STRUCTURE-V01'],policyRef:'M4-ZHENGGUAN-MONTH-STRUCTURE-V01',mustNotInfer:['REMOTE_PAIR_EQUALS_EFFECTIVE_COMBINATION','OFFICER_REMOVED','TRANSFORM_TO_WATER'],
    reason:'Year 辛/hour 丙 are an exact 五合 pair involving the visible officer. Original stems and the month officer are not erased or transformed.',
  },
  {
    id:'overlapping-si-shen-and-yin-hai-relations',kind:'SYNTHETIC_STRUCTURAL_UNIT',pillars:['丙寅','壬申','乙巳','丁亥'],monthTerm:'LIQIU',
    expected:{candidateStatus:'STRUCTURAL_CANDIDATE',candidateBasis:'MAIN_QI_ZHENGGUAN',monthBranch:'申',mainStem:'庚',mainTenGod:'正官',monthOfficers:[{stem:'庚',position:'MAIN_QI'}],officerExposure:[],competitionPresent:true,competingExposure:[{role:'month',stem:'壬'}],relationsInclude:[{leftRole:'month',rightRole:'day',kinds:['LIUHE','LIUPO','XING']},{leftRole:'year',rightRole:'hour',kinds:['LIUHE','LIUPO']},{leftRole:'year',rightRole:'month',kinds:['LIUCHONG','XING']}],finalEffects:'NOT_IMPLEMENTED'},
    sourceRef:['M4-PROJECT-ZHENGGUAN-STRUCTURE-V01'],policyRef:'M4-ZHENGGUAN-MONTH-STRUCTURE-V01',mustNotInfer:['ONE_RELATION_SUPPRESSES_THE_OTHERS','COMBINATION_ALWAYS_BEATS_CLASH','MONTH_OFFICER_DELETED_BY_RELATION'],
    reason:'The same position pair can retain 合/破/刑 together. Opposing and overlapping structures do not become a hidden priority rule.',
  },
  {
    id:'repeated-you-officer-members-keep-position',kind:'SYNTHETIC_STRUCTURAL_UNIT',pillars:['辛酉','乙酉','甲午','丁酉'],monthTerm:'BAILU',
    expected:{candidateStatus:'STRUCTURAL_CANDIDATE',candidateBasis:'MAIN_QI_ZHENGGUAN',monthBranch:'酉',mainStem:'辛',mainTenGod:'正官',monthOfficers:[{stem:'辛',position:'MAIN_QI'}],officerExposure:[{role:'year',stem:'辛'}],competitionPresent:false,competingExposure:[],hiddenOfficerIncludes:[{role:'year',branch:'酉',stem:'辛'},{role:'month',branch:'酉',stem:'辛'},{role:'hour',branch:'酉',stem:'辛'}],relationsInclude:[{leftRole:'year',rightRole:'month',kinds:['XING']},{leftRole:'year',rightRole:'hour',kinds:['XING']},{leftRole:'month',rightRole:'hour',kinds:['XING']}],finalEffects:'NOT_IMPLEMENTED'},
    sourceRef:['M4-PROJECT-ZHENGGUAN-STRUCTURE-V01'],policyRef:'M4-ZHENGGUAN-MONTH-STRUCTURE-V01',mustNotInfer:['DEDUPLICATE_EQUAL_BRANCH_CHARACTERS','THREE_OFFICER_LOCATIONS_ARE_THREE_FORCE_POINTS','SELF_PUNISHMENT_AUTO_BREAKS_PATTERN'],
    reason:'Three 酉 occurrences are three hidden officer locations and three distinct self-punishment position pairs, not one merged node or a numerical strength score.',
  },
  {
    id:'moving-officer-branch-to-month-selects-candidate',kind:'SYNTHETIC_STRUCTURAL_UNIT',pillars:['辛卯','乙酉','甲午','壬申'],monthTerm:'BAILU',
    expected:{candidateStatus:'STRUCTURAL_CANDIDATE',candidateBasis:'MAIN_QI_ZHENGGUAN',monthBranch:'酉',mainStem:'辛',mainTenGod:'正官',monthOfficers:[{stem:'辛',position:'MAIN_QI'}],officerExposure:[{role:'year',stem:'辛'}],competitionPresent:false,competingExposure:[],finalEffects:'NOT_IMPLEMENTED'},
    sourceRef:['M4-PROJECT-ZHENGGUAN-STRUCTURE-V01'],policyRef:'M4-ZHENGGUAN-MONTH-STRUCTURE-V01',mustNotInfer:['VISIBLE_STEM_PRESENCE_ALONE_CHOOSES_PATTERN','RELATION_CHANGES_ARE_EFFECT_PROOF'],
    reason:'Compare visible-officer-outside-month-no-candidate: four visible stems and day/hour branches stay fixed while year/month 卯酉 exchange. Officer existence persists but the actual month basis changes.',
  },
  {
    id:'day-master-only-month-member-is-not-competition',kind:'SYNTHETIC_STRUCTURAL_UNIT',pillars:['丙午','壬辰','癸丑','庚申'],monthTerm:'QINGMING',
    expected:{candidateStatus:'STRUCTURAL_CANDIDATE',candidateBasis:'MAIN_QI_ZHENGGUAN',monthBranch:'辰',mainStem:'戊',mainTenGod:'正官',monthOfficers:[{stem:'戊',position:'MAIN_QI'}],officerExposure:[],competitionPresent:false,competingExposure:[],exactDayMemberMatches:[{role:'day',stem:'癸'}],finalEffects:'NOT_IMPLEMENTED'},
    sourceRef:['M4-PROJECT-ZHENGGUAN-STRUCTURE-V01'],policyRef:'M4-ZHENGGUAN-MONTH-STRUCTURE-V01',mustNotInfer:['DAY_MASTER_IS_ANOTHER_VISIBLE_SUPPORT_TARGET','DAY_ONLY_GUI_AUTOMATICALLY_CREATES_BIJIAN_PATTERN'],
    reason:'辰 contains 癸, and the day stem is exactly 癸. Record that character link while the project competition rule excludes the day master by itself.',
  },
  {
    id:'non-day-repeated-month-member-is-competition',kind:'SYNTHETIC_STRUCTURAL_UNIT',pillars:['癸亥','壬辰','癸丑','庚申'],monthTerm:'QINGMING',
    expected:{candidateStatus:'STRUCTURAL_CANDIDATE',candidateBasis:'MAIN_QI_ZHENGGUAN',monthBranch:'辰',mainStem:'戊',mainTenGod:'正官',monthOfficers:[{stem:'戊',position:'MAIN_QI'}],officerExposure:[],competitionPresent:true,competingExposure:[{role:'year',stem:'癸'}],exactDayMemberMatches:[{role:'day',stem:'癸'}],finalEffects:'NOT_IMPLEMENTED'},
    sourceRef:['M4-PROJECT-ZHENGGUAN-STRUCTURE-V01'],policyRef:'M4-ZHENGGUAN-MONTH-STRUCTURE-V01',mustNotInfer:['REPEATED_GUI_POSITIONS_DEDUPLICATED','VISIBLE_PEER_ESTABLISHES_ANOTHER_PATTERN'],
    reason:'The year 癸 is a separate non-day exposure of another month member. It triggers selected competition review without erasing the MAIN_QI 戊官 candidate.',
  },
  {
    id:'other-officer-multiple-exact-exposure-positions',kind:'SYNTHETIC_STRUCTURAL_UNIT',pillars:['辛亥','乙丑','甲午','辛未'],monthTerm:'XIAOHAN',
    expected:{candidateStatus:'STRUCTURAL_CANDIDATE',candidateBasis:'OTHER_ZHENGGUAN_EXACTLY_EXPOSED',monthBranch:'丑',mainStem:'己',mainTenGod:'正財',monthOfficers:[{stem:'辛',position:'OTHER'}],officerExposure:[{role:'year',stem:'辛'},{role:'hour',stem:'辛'}],competitionPresent:false,competingExposure:[],finalEffects:'NOT_IMPLEMENTED'},
    sourceRef:['M4-PROJECT-ZHENGGUAN-STRUCTURE-V01'],policyRef:'M4-ZHENGGUAN-MONTH-STRUCTURE-V01',mustNotInfer:['DUPLICATE_CHARACTERS_DELETE_EXPOSURE_POSITION','TWO_OFFICERS_DOUBLE_FORCE','MULTIPLE_SAME_MEMBER_EXPOSURES_ARE_DIFFERENT_MONTH_MEMBER_COMPETITION'],
    reason:'The same month officer 辛 links to two real surface positions. Multiple occurrences of that one member are not exposure of a different month member.',
  },
  {
    id:'wu-other-officer-exposed-source-compatibility-review',kind:'SYNTHETIC_STRUCTURAL_UNIT',pillars:['己巳','丙午','壬寅','庚子'],monthTerm:'MANGZHONG',
    expected:{candidateStatus:'SOURCE_OR_POLICY_UNRESOLVED',candidateBasis:'OTHER_MONTH_MEMBER_COMPATIBILITY_REVIEW',monthBranch:'午',mainStem:'丁',mainTenGod:'正財',monthOfficers:[{stem:'己',position:'OTHER'}],officerExposure:[{role:'year',stem:'己'}],competitionPresent:false,competingExposure:[],reasonCode:'WU_BRANCH_HIDDEN_TABLE_COMPATIBILITY_NOT_SELECTED',finalEffects:'NOT_IMPLEMENTED'},
    sourceRef:['M4-ZPZQ-ORIGINAL-BIANHUA-NCC','M4-PROJECT-ZHENGGUAN-STRUCTURE-V01'],policyRef:'M4-ZHENGGUAN-MONTH-STRUCTURE-V01',mustNotInfer:['ALTER_M2_WU_HIDDEN_TABLE','EXPOSED_JI_CLOSES_TEXTUAL_COMPATIBILITY','ALL_WU_MONTH_INPUTS_FAIL'],
    reason:'The existing M2 午 row 丁己 is preserved, but this OTHER officer selection is not conflated with the textual 子午卯酉專氣 convention. Exact exposure does not resolve that compatibility choice.',
  },
  {
    id:'wu-other-officer-unexposed-source-compatibility-review',kind:'SYNTHETIC_STRUCTURAL_UNIT',pillars:['乙巳','丙午','壬寅','庚子'],monthTerm:'MANGZHONG',
    expected:{candidateStatus:'SOURCE_OR_POLICY_UNRESOLVED',candidateBasis:'OTHER_MONTH_MEMBER_COMPATIBILITY_REVIEW',monthBranch:'午',mainStem:'丁',mainTenGod:'正財',monthOfficers:[{stem:'己',position:'OTHER'}],officerExposure:[],competitionPresent:false,competingExposure:[],reasonCode:'WU_BRANCH_HIDDEN_TABLE_COMPATIBILITY_NOT_SELECTED',finalEffects:'NOT_IMPLEMENTED'},
    sourceRef:['M4-ZPZQ-ORIGINAL-BIANHUA-NCC','M4-PROJECT-ZHENGGUAN-STRUCTURE-V01'],policyRef:'M4-ZHENGGUAN-MONTH-STRUCTURE-V01',mustNotInfer:['UNEXPOSED_OTHER_OFFICER_IS_ABSENT','MAKE_COMPATIBILITY_UNRESOLVED_A_CALENDAR_FAILURE'],
    reason:'The same bounded compatibility question is retained without visible 己. The calendar, hidden member and officer existence remain available.',
  },
];

export const M4_ZHENGGUAN_PARTIAL_TEXT_CONTRACTS = [
  {id:'partial-xin-yin-bing-exposure',kind:'INCOMPLETE_TEXTUAL_CONTEXT_NOT_FOUR_PILLAR_CHART',given:{dayMaster:'辛',monthBranch:'寅',visibleStems:['丙']},expected:{monthOfficer:'丙',position:'OTHER',candidateUnderSelectedPolicy:true},sourceRef:['M4-ZPZQ-ORIGINAL-BIANHUA-NCC'],policyRef:'M4-ZHENGGUAN-MONTH-STRUCTURE-V01',mustNotInfer:['INVENT_YEAR_DAY_HOUR_PILLARS','RECONSTRUCT_BIRTH_DATE','FINAL_GE_CHENG'],reason:'Use the textual condition only at its stated granularity.'},
  {id:'partial-xin-yin-jia-bing-coexposure',kind:'INCOMPLETE_TEXTUAL_CONTEXT_NOT_FOUR_PILLAR_CHART',given:{dayMaster:'辛',monthBranch:'寅',visibleStems:['甲','丙']},expected:{monthOfficer:'丙',candidateUnderSelectedPolicy:true,competitionUnderSelectedPolicy:true},sourceRef:['M4-ZPZQ-ORIGINAL-BIANHUA-NCC'],policyRef:'M4-ZHENGGUAN-MONTH-STRUCTURE-V01',mustNotInfer:['MULTIPLE_EXPOSURE_ERASES_OFFICER','EXCLUSIVE_PATTERN_SELECTION_CONFIRMED','CHOOSE_GE_CHENG'],reason:'The source co-use context prevents a rule that deletes the officer candidate merely because another member is exposed.'},
];

export const M4_ZHENGGUAN_BOUNDARY_CONTRACTS = [
  {id:'2026-lichun-two-existing-parents',kind:'MODERN_CALENDAR_RECORD_INTEGRATION_EXPECTATION_NOT_M4_RESOLVER_OUTPUT',input:{calendar:'GREGORIAN',date:'2026-02-04',time:'05:02'},expectedParents:[{pillars:['乙巳','己丑','己酉','丁卯'],candidateStatus:'NOT_A_CANDIDATE_UNDER_POLICY',candidateBasis:'NO_MONTH_ZHENGGUAN'},{pillars:['丙午','庚寅','己酉','丁卯'],candidateStatus:'STRUCTURAL_CANDIDATE',candidateBasis:'MAIN_QI_ZHENGGUAN',monthOfficer:'甲',competitionPresent:true}],mustNotInfer:['CARTESIAN_PRODUCT','FIRST_PARENT_ONLY','MIX_MONTH_MEMBER_REFERENCES'],sourceRef:['docs/engineering/KASI_M3_LIMITED_SYNTHESIS_EXECUTION_20261112.md'],policyRef:'M4-ZHENGGUAN-MONTH-STRUCTURE-V01',reason:'Expected existing parent pillars come from prior calendar execution records; new M4 expectations are manually derived from the selected table.'},
  {id:'2026-pre18-one-parent-two-seasonal-alternatives',kind:'MODERN_CALENDAR_RECORD_INTEGRATION_EXPECTATION_NOT_M4_RESOLVER_OUTPUT',input:{calendar:'GREGORIAN',date:'2026-04-17',time:'20:49'},expected:{pillars:['丙午','壬辰','辛酉','戊戌'],parentCount:1,seasonalAlternativeCount:2,m4CandidateCount:1,candidateStatus:'NOT_A_CANDIDATE_UNDER_POLICY',candidateBasis:'NO_MONTH_ZHENGGUAN',visibleOfficer:{role:'year',stem:'丙'}},mustNotInfer:['SEASONAL_ALTERNATIVE_IS_NEW_NATAL_PARENT','CHANGE_HIDDEN_STEMS_AT_PRE18_BOUNDARY'],sourceRef:['docs/engineering/KASI_M3_LIMITED_SYNTHESIS_EXECUTION_20261112.md'],policyRef:'M4-ZHENGGUAN-MONTH-STRUCTURE-V01',reason:'The source month 辰 and natal pillars remain the same while seasonal judgment has two alternatives. Visible 丙官 does not supply a missing month officer.'},
  {id:'upstream-m3-strength-unresolved-does-not-block-candidate',kind:'PROJECT_CONTRACT',given:{upstreamFinalStrength:'NOT_IMPLEMENTED',limitedSynthesisConclusion:null},expected:{m4StructureAnalysisAllowed:true,upstreamFieldsUnchanged:true},mustNotInfer:['M3_NOT_IMPLEMENTED_MEANS_M4_INPUT_FAILURE','M4_CANDIDATE_UPGRADES_STRENGTH'],sourceRef:['M4-PROJECT-ZHENGGUAN-STRUCTURE-V01'],policyRef:'M4-ZHENGGUAN-MONTH-STRUCTURE-V01',reason:'Structural candidate selection does not require the unfinished force comparison.'},
];

export const M4_ZHENGGUAN_REJECTION_CONTRACTS = [
  {id:'foreign-parent-month-member',mutation:'USE_ANOTHER_PARENT_MONTH_HIDDEN_MEMBER_OR_TEN_GOD_REFERENCE',expected:'REJECT',reason:'A valid member of another parent is not this parent evidence.'},
  {id:'missing-month-members',mutation:'REMOVE_REQUIRED_MONTH_HIDDEN_STEM_FACT',expected:'REJECT',reason:'Missing evidence is not absence of an officer.'},
  {id:'sparse-month-member-array',mutation:'DELETE_AN_ARRAY_SLOT_WITHOUT_CHANGING_LENGTH',expected:'REJECT',reason:'A sparse array must not evade full-member validation.'},
  {id:'duplicate-member-link',mutation:'DUPLICATE_THE_SAME_MEMBER_ID_OR_EXPOSURE_LINK',expected:'REJECT',reason:'Repeated natal characters are legitimate; the same position link twice is not.'},
  {id:'unknown-source-or-rule',mutation:'REPLACE_A_REQUIRED_SOURCE_OR_RULE_REFERENCE_WITH_AN_UNKNOWN_ID',expected:'REJECT',reason:'Narrative references must terminate in the actual selected registries.'},
  {id:'wrong-or-missing-profile',mutation:'OMIT_PROFILE_OR_SELECT_UNKNOWN_PROFILE',expected:'REJECT',reason:'No hidden school or policy default is permitted.'},
  {id:'promoted-final-effect',mutation:'CHANGE_FINAL_PATTERN_EFFECT_TO_GE_CHENG_GE_BAI_OR_JIU_YING_CONFIRMED',expected:'REJECT',reason:'The structural profile does not issue those effects.'},
  {id:'cross-request-input-or-result-mutation',mutation:'USE_FOREIGN_ISSUED_INPUT_OR_MUTATE_CANDIDATE_POLICY_OR_SOURCE_AFTER_ISSUANCE',expected:'REJECT',reason:'Same-process continuity is required without pretending it authenticates external editions.'},
];
