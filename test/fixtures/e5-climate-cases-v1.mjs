// Synthetic four-pillar fixtures. All expected states are fixed by hand from
// the written policy, prior to running the new resolver.
export const CLIMATE_CASES = [
  ['winter-wood-no-fire', ['庚申','壬子','甲辰','癸酉'], 'DAXUE', 'CANDIDATE', ['FIRE',null], 'WARMTH_UNOBSERVED'],
  ['winter-wood-hidden-fire', ['庚申','壬子','甲子','戊戌'], 'DAXUE', 'EXISTING_EFFECT_UNRESOLVED', null, 'TARGET_ALREADY_OBSERVED'],
  ['winter-wood-competing', ['丙寅','壬子','甲辰','癸酉'], 'DAXUE', 'COMPETING', null, 'NEARBY_SURFACE_CONTROL'],
  ['summer-jia-si-unobserved', ['丙寅','丁巳','甲寅','甲戌'], 'LIXIA', 'CANDIDATE', ['WATER','癸'], 'COOLING_STEM_UNOBSERVED'],
  ['summer-jia-wu-unobserved', ['丙寅','庚午','甲寅','甲戌'], 'MANGZHONG', 'CANDIDATE', ['WATER','癸'], 'COOLING_STEM_UNOBSERVED'],
  ['summer-jia-inactive', ['庚申','壬午','甲寅','庚申'], 'MANGZHONG', 'HOLD', null, 'EXPOSED_FIRE_NOT_OBSERVED'],
  ['summer-jia-distant-heat', ['庚辰','壬午','甲辰','丁卯'], 'MANGZHONG', 'EXISTING_EFFECT_UNRESOLVED', null, 'TARGET_ALREADY_OBSERVED'],
  ['summer-jia-hidden-rain', ['丙寅','丁巳','甲辰','庚午'], 'LIXIA', 'EXISTING_EFFECT_UNRESOLVED', null, 'TARGET_ALREADY_OBSERVED'],
  ['summer-jia-competing', ['丙寅','丁巳','甲辰','戊辰'], 'LIXIA', 'COMPETING', null, 'NEARBY_SURFACE_CONTROL'],
  ['summer-jia-alternative-water', ['丙寅','壬午','甲寅','甲戌'], 'MANGZHONG', 'HOLD', null, 'OTHER_WATER_STEM_UNRESOLVED'],
  ['winter-geng-warmth-unobserved', ['甲申','壬子','庚申','癸酉'], 'DAXUE', 'CANDIDATE', ['FIRE','丙'], 'WARMTH_UNOBSERVED'],
  ['winter-geng-distant-heat', ['甲申','壬子','庚申','丙戌'], 'DAXUE', 'EXISTING_EFFECT_UNRESOLVED', null, 'TARGET_ALREADY_OBSERVED'],
  ['winter-geng-competing', ['壬申','丙子','庚申','乙酉'], 'DAXUE', 'COMPETING', null, 'NEARBY_SURFACE_CONTROL'],
  ['winter-geng-inactive', ['甲申','甲子','庚申','乙酉'], 'DAXUE', 'HOLD', null, 'EXPOSED_WATER_CONTEXT_NOT_OBSERVED'],
  ['winter-geng-other-fire', ['甲申','壬子','庚申','丁卯'], 'DAXUE', 'HOLD', null, 'OTHER_FIRE_STEM_UNRESOLVED'],
  ['winter-geng-commentary-context', ['甲申','丙子','庚辰','甲申'], 'DAXUE', 'COMPETING', null, 'COMPLETE_WATER_MEMBERSHIP_EFFECT_UNRESOLVED'],
  ['winter-geng-hai-review', ['甲申','乙亥','庚申','丙戌'], 'LIDONG', 'OBSERVATION_ONLY', null, 'DOCUMENTARY_CONTEXT_ONLY'],
  ['winter-geng-chou-review', ['甲申','丁丑','庚申','丙戌'], 'XIAOHAN', 'OBSERVATION_ONLY', null, 'DOCUMENTARY_CONTEXT_ONLY'],
  ['summer-jia-wei-review', ['甲申','辛未','甲申','丙戌'], 'XIAOSHU', 'OBSERVATION_ONLY', null, 'DOCUMENTARY_CONTEXT_ONLY'],
  ['other-day-outside', ['甲申','壬午','乙卯','丙戌'], 'MANGZHONG', 'OUT_OF_SCOPE', null, 'NO_RULE_FOR_STEM_MONTH'],
];
