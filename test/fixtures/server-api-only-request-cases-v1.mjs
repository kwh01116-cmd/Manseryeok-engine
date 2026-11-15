/** Fixed public DTO contracts. Synthetic requests test validation, not actual calendar calculation. */
const base={
 schemaVersion:'manseryeok-server-analysis-request-v1',
 analysisProfileId:'KASI-SERVER-API-ONLY-ANALYSIS-V01',
 calendarProfileId:'kasi-api-1989-2026-local-v1',jurisdiction:'KR',timeZone:'Asia/Seoul',
 calendar:'GREGORIAN',date:'2026-01-08',time:'12:00',
 policies:{clockPolicyId:'KR_API_PUBLISHED_KST_MODERN_1988_POST_DST_V1',dayRollover:'CIVIL_MIDNIGHT',hourStemReference:'SELECTED_DAY_PILLAR'},
};
const modern=change=>({...base,...change});
const policies=change=>({...base.policies,...change});
export const SERVER_REQUEST_LITERAL_BASE=base;
export const SERVER_REQUEST_CASES_V1=[
 {id:'MODERN_EXPLICIT',input:modern({}),expected:'ACCEPT',reason:'Explicit modern calculation and civil-clock profile; validation alone makes no product-result claim.'},
 {id:'HISTORICAL_EXPLICIT',input:modern({calendarProfileId:'kasi-api-1962-1986-standard-local-v1',date:'1975-06-01',policies:policies({clockPolicyId:'KR_API_PUBLISHED_KST_HISTORICAL_1962_1986_NO_DST_V1'})}),expected:'ACCEPT',reason:'Separate historical profile; no silent modern-clock fallback.'},
 {id:'DST_STANDARD_REFERENCE',input:modern({calendarProfileId:'kasi-api-1987-1988-dst-local-v1',date:'1988-10-09',time:'02:30',policies:policies({clockPolicyId:'KR_API_PUBLISHED_KST_DST_1987_1988_STANDARD_REFERENCE_V1',dayHourReference:'STANDARD_KST',foldOffsetMinutes:600})}),expected:'ACCEPT',reason:'An explicit fold offset is an input condition, not validation of a unique real instant.'},
 {id:'FUTURE_SOLAR_EXPLICIT',input:modern({calendarProfileId:'kasi-api-1989-2027-solar-local-v1',date:'2027-06-01',policies:policies({clockPolicyId:'KR_API_PUBLISHED_KST_MODERN_1989_2027_NO_DST_V2'})}),expected:'ACCEPT',reason:'Separate 2027 Gregorian profile; lunar availability is a runtime data question.'},
 {id:'UNKNOWN_TIME_NULL',input:modern({time:null}),expected:'ACCEPT',reason:'Explicit unknown time must not be converted to midnight/noon or a timed natal chart.'},
 {id:'LUNAR_SHAPE',input:{...modern({calendar:'KOREAN_LUNAR',lunarDate:{lunarYear:2025,lunarMonth:11,lunarDay:20,leap:false}}),date:undefined},expected:'ACCEPT',reason:'Valid typed lunar shape; no private data or real conversion is asserted.'},
 {id:'MODERN_MONTHLY_V1',input:modern({monthlyOptions:{policyId:'M7-MONTHLY-TWELVE-JIE-PUBLISHED-MINUTE-V01',year:2026,queryMinute:'2026-02-04T05:02'}}),expected:'ACCEPT',reason:'Modern monthly v1 selected explicitly.'},
 {id:'FUTURE_MONTHLY_V2',input:modern({calendarProfileId:'kasi-api-1989-2027-solar-local-v1',date:'2027-06-01',policies:policies({clockPolicyId:'KR_API_PUBLISHED_KST_MODERN_1989_2027_NO_DST_V2'}),monthlyOptions:{policyId:'M7-MONTHLY-TWELVE-JIE-PUBLISHED-MINUTE-EXTENDED-2027-V02',year:2027}}),expected:'ACCEPT',reason:'Future monthly v2 has its own boundaries; input acceptance does not promise missing 2028 events.'},
 {id:'EXPERIMENTAL_EXPLICIT_MODERN',input:modern({experimentalPolicyId:'EXPERIMENTAL-WEIGHTED-SUPPORT-LOCAL-NO-TRANSFORMATION-V01'}),expected:'ACCEPT',reason:'The heuristic is explicitly opted in and remains distinct from default analysis.'},
 {id:'LUCK_EXPLICIT',input:modern({luckOptions:{luckPolicyId:'M7-TRADITIONAL-YEAR-STEM-JIE-3D-V01',features:{dayun:{traditionalSex:'MALE',count:3},seyun:{yearLabel:2026}},calendarProjectionPolicyId:'M7-CALENDAR-NOMINAL-YMDH-SEQUENTIAL-CLAMP-V02',asOfMinute:'2026-06-01T12:00'}}),expected:'ACCEPT',reason:'Existing luck-selection contract requires explicit sex/count/projection and as-of.'},
 {id:'PROFILE_MISSING',input:modern({calendarProfileId:undefined}),expected:'REJECT',code:'EXPLICIT_SERVER_CALENDAR_PROFILE_REQUIRED',reason:'No hidden calendar profile.'},
 {id:'WRONG_COUNTRY',input:modern({jurisdiction:'JP'}),expected:'REJECT',code:'EXPLICIT_KR_JURISDICTION_AND_TIMEZONE_REQUIRED',reason:'A Korea-only clock cannot accept another jurisdiction.'},
 {id:'WRONG_TIMEZONE',input:modern({timeZone:'UTC'}),expected:'REJECT',code:'EXPLICIT_KR_JURISDICTION_AND_TIMEZONE_REQUIRED',reason:'Host timezone and requested recorded civil-time zone are distinct.'},
 {id:'GREGORIAN_AND_LUNAR',input:modern({lunarDate:{lunarYear:2025,lunarMonth:11,lunarDay:20,leap:false}}),expected:'REJECT',code:'SERVER_GREGORIAN_INPUT',reason:'Calendar forms cannot be mixed.'},
 {id:'LUNAR_AND_GREGORIAN',input:modern({calendar:'KOREAN_LUNAR',lunarDate:{lunarYear:2025,lunarMonth:11,lunarDay:20,leap:false}}),expected:'REJECT',code:'SERVER_LUNAR_INPUT',reason:'Lunar form cannot carry an independent Gregorian date.'},
 {id:'INVALID_WALL_TIME_2400',input:modern({time:'24:00'}),expected:'REJECT',code:'EXPLICIT_TIME_OR_NULL_REQUIRED',reason:'Published API notation is not an accepted birth wall-clock notation.'},
 {id:'INVALID_GREGORIAN_DATE',input:modern({date:'2026-02-30'}),expected:'REJECT',reason:'Invalid civil date must not normalize into March.'},
 {id:'CLOCK_PROFILE_CONFLICT',input:modern({policies:policies({clockPolicyId:'KR_API_PUBLISHED_KST_HISTORICAL_1962_1986_NO_DST_V1'})}),expected:'REJECT',code:'SERVER_CLOCK_PROFILE_CONFLICT',reason:'No profile/clock substitution.'},
 {id:'DST_WITHOUT_STANDARD_REFERENCE',input:modern({calendarProfileId:'kasi-api-1987-1988-dst-local-v1',date:'1988-10-09',policies:policies({clockPolicyId:'KR_API_PUBLISHED_KST_DST_1987_1988_STANDARD_REFERENCE_V1'})}),expected:'REJECT',code:'SERVER_DST_STANDARD_REFERENCE_REQUIRED',reason:'DST day/hour reference is a required policy choice.'},
 {id:'DST_OFFSET_570',input:modern({calendarProfileId:'kasi-api-1987-1988-dst-local-v1',date:'1988-10-09',policies:policies({clockPolicyId:'KR_API_PUBLISHED_KST_DST_1987_1988_STANDARD_REFERENCE_V1',dayHourReference:'STANDARD_KST',foldOffsetMinutes:570})}),expected:'REJECT',code:'SERVER_DST_FOLD_OFFSET',reason:'Only supported standard/DST offset choices are admitted.'},
 {id:'MODERN_WITH_DST_OPTION',input:modern({policies:policies({foldOffsetMinutes:540})}),expected:'REJECT',code:'SERVER_DST_OPTIONS_REQUIRE_DST_PROFILE',reason:'DST-specific input cannot be silently ignored under another profile.'},
 {id:'FOREIGN_POLICY',input:modern({policies:policies({rootPolicyId:'UNREQUESTED_POLICY'})}),expected:'REJECT',code:'SERVER_POLICY_FIELDS',reason:'Subpolicy selection is owned by the server analysis profile.'},
 {id:'EXPERIMENTAL_HISTORICAL',input:modern({calendarProfileId:'kasi-api-1962-1986-standard-local-v1',date:'1975-06-01',policies:policies({clockPolicyId:'KR_API_PUBLISHED_KST_HISTORICAL_1962_1986_NO_DST_V1'}),experimentalPolicyId:'EXPERIMENTAL-WEIGHTED-SUPPORT-LOCAL-NO-TRANSFORMATION-V01'}),expected:'REJECT',code:'SERVER_EXPERIMENTAL_POLICY_REQUIRES_MODERN_PROFILE',reason:'No heuristic clock-scope widening.'},
 {id:'MODERN_WITH_MONTHLY_V2',input:modern({monthlyOptions:{policyId:'M7-MONTHLY-TWELVE-JIE-PUBLISHED-MINUTE-EXTENDED-2027-V02',year:2026}}),expected:'REJECT',code:'SERVER_EXPLICIT_MONTHLY_POLICY',reason:'Monthly policy versions are not silently interchanged.'},
 {id:'LUCK_ASOF_WITHOUT_PROJECTION',input:modern({luckOptions:{luckPolicyId:'M7-TRADITIONAL-YEAR-STEM-JIE-3D-V01',features:{dayun:{traditionalSex:'FEMALE',count:2}},asOfMinute:'2026-06-01T12:00'}}),expected:'REJECT',code:'AS_OF_REQUIRES_EXPLICIT_CALENDAR_PROJECTION',reason:'Existing nominal calendar projection remains explicit.'},
];
