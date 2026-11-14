// Fixed before the resolver. These are finite cycle arithmetic contracts, not fate predictions.
// Six literal xun groups; every day pillar and its two unpaired branches are explicit.
export const GONGMANG_60_EXPECTED = [
  ['甲子','戌亥'],['乙丑','戌亥'],['丙寅','戌亥'],['丁卯','戌亥'],['戊辰','戌亥'],['己巳','戌亥'],['庚午','戌亥'],['辛未','戌亥'],['壬申','戌亥'],['癸酉','戌亥'],
  ['甲戌','申酉'],['乙亥','申酉'],['丙子','申酉'],['丁丑','申酉'],['戊寅','申酉'],['己卯','申酉'],['庚辰','申酉'],['辛巳','申酉'],['壬午','申酉'],['癸未','申酉'],
  ['甲申','午未'],['乙酉','午未'],['丙戌','午未'],['丁亥','午未'],['戊子','午未'],['己丑','午未'],['庚寅','午未'],['辛卯','午未'],['壬辰','午未'],['癸巳','午未'],
  ['甲午','辰巳'],['乙未','辰巳'],['丙申','辰巳'],['丁酉','辰巳'],['戊戌','辰巳'],['己亥','辰巳'],['庚子','辰巳'],['辛丑','辰巳'],['壬寅','辰巳'],['癸卯','辰巳'],
  ['甲辰','寅卯'],['乙巳','寅卯'],['丙午','寅卯'],['丁未','寅卯'],['戊申','寅卯'],['己酉','寅卯'],['庚戌','寅卯'],['辛亥','寅卯'],['壬子','寅卯'],['癸丑','寅卯'],
  ['甲寅','子丑'],['乙卯','子丑'],['丙辰','子丑'],['丁巳','子丑'],['戊午','子丑'],['己未','子丑'],['庚申','子丑'],['辛酉','子丑'],['壬戌','子丑'],['癸亥','子丑'],
];
// The label year begins at Lichun, not January 1. These are separate literal 5-tiger expectations.
export const MONTHLY_2025_EXPECTED = ['戊寅','己卯','庚辰','辛巳','壬午','癸未','甲申','乙酉','丙戌','丁亥','戊子','己丑'];
export const MONTHLY_2026_EXPECTED = ['庚寅','辛卯','壬辰','癸巳','甲午','乙未','丙申','丁酉','戊戌','己亥','庚子','辛丑'];
export const MONTHLY_BOUNDARY_EXPECTED = {
  beforeLichun2026: {year:'乙巳',month:'己丑'},
  afterLichun2026: {year:'丙午',month:'庚寅'},
  beforeJingzhe2026: {year:'丙午',month:'庚寅'},
  afterJingzhe2026: {year:'丙午',month:'辛卯'},
  january2026: {year:'乙巳',month:'己丑'},
};
