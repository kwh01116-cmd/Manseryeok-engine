// Synthetic minute inputs only. These timestamps are not actual KASI publications.
const rows=[
  ['XIAOHAN','01-05'],['LICHUN','02-04'],['JINGZHE','03-05'],['QINGMING','04-05'],['LIXIA','05-05'],['MANGZHONG','06-05'],
  ['XIAOSHU','07-07'],['LIQIU','08-07'],['BAILU','09-07'],['HANLU','10-08'],['LIDONG','11-07'],['DAXUE','12-07'],
];
export const MONTHLY_SYNTHETIC_EVENTS=[2025,2026].flatMap(year=>rows.map(([term,date])=>({term,displayedDateTime:year+'-'+date+'T12:00',timeBasis:'KST',sourcePrecision:'MINUTE',sourceIds:['SYNTHETIC-MONTHLY-'+year+'-'+term]})));
