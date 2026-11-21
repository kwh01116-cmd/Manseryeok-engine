// Hand-accounted four-pillar constructions, frozen before E1/M5 implementation.
// These are composition tests. No claim of a real birth date or calendar-valid month stem.
export const cases = [
  { id:'peer', pillars:['丙子','乙卯','甲子','辛酉'], support:72, causes:['PEER'], primary:'OUTPUT', status:'SINGLE_CANDIDATE' },
  { id:'resource', pillars:['丙子','癸亥','甲子','己酉'], support:72, causes:['RESOURCE'], primary:'WEALTH', status:'SINGLE_CANDIDATE' },
  { id:'borderline', pillars:['壬子','辛酉','甲子','乙酉'], support:48, causes:[], primary:null, status:'HOLD', hold:'BORDERLINE_STRENGTH' },
  { id:'officer', pillars:['戊午','丁酉','甲子','己酉'], support:20, causes:['OFFICER'], primary:'RESOURCE', status:'SINGLE_CANDIDATE' },
  { id:'wealth', pillars:['戊辰','己丑','甲子','乙酉'], support:40, causes:['WEALTH'], primary:'PEER', status:'SINGLE_CANDIDATE' },
  { id:'output', pillars:['丙午','丁巳','甲子','癸酉'], support:30, causes:['OUTPUT'], primary:'RESOURCE', status:'SINGLE_CANDIDATE' },
  { id:'extreme', pillars:['甲子','乙卯','甲子','乙卯'], support:100, causes:[], primary:null, status:'HOLD', hold:'SPECIAL_STRUCTURE_REVIEW' },
  { id:'missingFirst', pillars:['庚子','乙卯','甲辰','辛酉'], support:60, causes:['PEER'], primary:'OFFICER', status:'SINGLE_CANDIDATE' },
  { id:'competing', pillars:['丙辰','甲子','甲寅','己卯'], support:68, causes:['PEER','RESOURCE'], primary:null, status:'COMPETING_CANDIDATES', leaders:['OUTPUT','WEALTH'] },
];
