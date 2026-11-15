/** Fictional births. Literal expectations are API day records + manual Jie/year/hour arithmetic,
 * not resolver output. These are connection fixtures, not an external prediction benchmark.
 * The API calendar month is deliberately NOT substituted for the Jie month (1986-12-31).
 */
export const SPRINT4_REAL_BIRTH_CASES=Object.freeze([
 {id:'H1962',date:'1962-06-01',time:'12:00',scope:'HISTORICAL',expected:['壬寅','乙巳','庚午','壬午'],lunar:[1962,4,29,false],sourceRef:'KASI15012679_DAY_RECORD_AND_MANUAL_JIE_FIVE_TIGERS_FIVE_RATS'},
 {id:'H1969',date:'1969-01-01',time:'12:00',scope:'HISTORICAL',expected:['戊申','甲子','丙子','甲午'],lunar:[1968,11,13,false],sourceRef:'KASI15012679_DAY_RECORD_AND_MANUAL_JIE_FIVE_TIGERS_FIVE_RATS'},
 {id:'H1975',date:'1975-07-15',time:'12:00',scope:'HISTORICAL',expected:['乙卯','癸未','壬戌','丙午'],lunar:[1975,6,7,false],sourceRef:'KASI15012679_DAY_RECORD_AND_MANUAL_JIE_FIVE_TIGERS_FIVE_RATS'},
 {id:'H1980',date:'1980-10-15',time:'12:00',scope:'HISTORICAL',expected:['庚申','丙戌','辛酉','甲午'],lunar:[1980,9,7,false],sourceRef:'KASI15012679_DAY_RECORD_AND_MANUAL_JIE_FIVE_TIGERS_FIVE_RATS'},
 {id:'H1986',date:'1986-12-31',time:'23:30',scope:'HISTORICAL',expected:['丙寅','庚子','己酉','甲子'],lunar:[1986,12,1,false],sourceRef:'KASI15012679_DAY_RECORD_JIE_MONTH_NOT_API_LUNAR_MONTH'},
 {id:'F2027JAN',date:'2027-01-08',time:'12:00',scope:'EXTENDED_SOLAR',expected:['丙午','辛丑','丁亥','丙午'],sourceRef:'MANUAL_2026_JAN8_RECORDED_REN_WU_PLUS_365_DAYS_AND_JIE'},
 {id:'F2027JUN',date:'2027-06-01',time:'12:00',scope:'EXTENDED_SOLAR',expected:['丁未','乙巳','辛亥','甲午'],sourceRef:'MANUAL_2026_JUN1_RECORDED_BING_WU_PLUS_365_DAYS_AND_JIE'},
]);
export const SPRINT4_BOUNDARY_CASE={date:'2027-02-04',time:'10:46',expected:[['丙午','辛丑','甲寅','己巳'],['丁未','壬寅','甲寅','己巳']],sourceRef:'EXISTING_2027_API_LICHUN_MINUTE_AND_2026_JI_YOU_PLUS365'};
