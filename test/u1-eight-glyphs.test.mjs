import test from 'node:test';
import assert from 'node:assert/strict';
import { projectKoreanV0Story, resolveKoreanBirthChartPreview, createKoreanLunisolarConverter,
  KASI_KOREAN_LUNISOLAR_2025_2027, ganZhiAt, labelKoreanGanZhi } from '../dist/index.js';
import { projectEightGlyphs } from '../dist/story/eightGlyphsProjection.js';
import { KOREA_SOLAR_TERM_EVENTS_2026_2027 as events } from '../dist/calendar/koreaSolarTermFixtures.js';

const policy={timeBasis:'KOREAN_CIVIL_TIME',dayRollover:'CIVIL_MIDNIGHT',hourStemReference:'SELECTED_DAY_PILLAR'};
const manifest={schemaVersion:'m1-solar-term-coverage-v1',requirementProfile:'FULL_24_TERM_YEAR',timeBasis:'KST',
  sourcePrecision:'MINUTE',supportedFromInclusive:'2026-01-01T00:00',supportedUntilExclusive:'2028-01-01T00:00',
  requiredYears:[2026,2027],requiredPriorBoundary:{year:2025,term:'DAXUE'}};
const converter=createKoreanLunisolarConverter(KASI_KOREAN_LUNISOLAR_2025_2027);
const solar=date=>({calendar:'GREGORIAN',gregorianDate:date});
const lunar=(day)=>({calendar:'KOREAN_LUNAR',lunarDate:{lunarYear:2026,lunarMonth:12,lunarDay:day,isLeapMonth:false}});
const resolve=(input=solar('2027-02-05'),clock='12:00',p=policy)=>
  resolveKoreanBirthChartPreview(input,clock,p,converter,events,manifest);
const roles=['year','month','day','hour'];
// Independent fixed oracle, not generated from the implementation's lookup tables.
const elements={甲:'WOOD',乙:'WOOD',丙:'FIRE',丁:'FIRE',戊:'EARTH',己:'EARTH',庚:'METAL',辛:'METAL',壬:'WATER',癸:'WATER',
  子:'WATER',丑:'EARTH',寅:'WOOD',卯:'WOOD',辰:'EARTH',巳:'FIRE',午:'FIRE',未:'EARTH',申:'METAL',酉:'METAL',戌:'EARTH',亥:'WATER'};

function assertChapter(chapter,candidate,i){
  assert.equal(chapter.schemaVersion,'u1-eight-glyphs-v1');
  assert.equal(chapter.candidateIndex,i);
  assert.equal(chapter.sourcePreviewVersion,'v0-korean-birth-chart-preview-v1');
  assert.equal(chapter.evidenceClass,'CALCULATED_CLASSIFICATION_ONLY');
  assert.equal(chapter.symbols.length,8);
  assert.equal(new Set(chapter.symbols.map(f=>f.factRef)).size,8);
  for(const [j,fact] of chapter.symbols.entries()){
    const role=roles[Math.floor(j/2)],stem=j%2===0,part=stem?'stem':'branch';
    assert.equal(fact.role,role);assert.equal(fact.kind,stem?'STEM':'BRANCH');
    assert.equal(fact.glyph,candidate[role][part]);assert.equal(fact.hangul,candidate[role].hangul[stem?0:1]);
    assert.equal(fact.element,elements[fact.glyph]);
    assert.equal(fact.factRef,`preview.candidates[${i}].${role}.${part}`);
    assert.equal(fact.pillarFactRef,`preview.candidates[${i}].${role}.hanja`);
    assert.equal(fact.pillarHanja,candidate[role].hanja);
    assert.equal(fact.elementLookupRef,stem?'src/domain/stems.ts#STEM_NATURE':'src/domain/branches.ts#BRANCH_NATURE');
    assert.deepEqual(Object.keys(fact).sort(),['role','kind','glyph','hangul','element','factRef','pillarFactRef','pillarHanja','elementLookupRef'].sort());
  }
}

test('EP3-01: ordinary chart projects eight factual symbols and preserves existing beats',()=>{
  const result=resolve(),story=projectKoreanV0Story(result);
  assertChapter(story.candidates[0].eightGlyphs,result.preview.candidates[0],0);
  assert.deepEqual(story.candidates[0].eightGlyphs.symbols.map(f=>f.glyph),['丁','未','壬','寅','乙','卯','壬','午']);
  assert.deepEqual(story.candidates[0].beats.map(b=>b.type),['FOUR_PILLARS','DAY_STEM_CLASSIFICATION','MONTH_BRANCH_CLASSIFICATION','MONTH_APPLIED_JIE_CONTEXT']);
  assert.equal(story.policies.dayRollover,'CIVIL_MIDNIGHT');
});

test('EP3-02/03: solar/lunar charts keep identical eight-symbol chapters for each Lichun alternative',()=>{
  for(const [day,date,clock] of [[29,'2027-02-05','12:00'],[28,'2027-02-04','10:45'],[28,'2027-02-04','10:46'],[28,'2027-02-04','10:47']]){
    const a=resolve(solar(date),clock),b=resolve(lunar(day),clock);
    const story=projectKoreanV0Story(a);
    assert.deepEqual(story,projectKoreanV0Story(b));
    for(const [i,candidate] of story.candidates.entries()) assertChapter(candidate.eightGlyphs,a.preview.candidates[i],i);
    if(clock==='10:46'){
      assert.equal(story.candidates.flatMap(c=>c.eightGlyphs.symbols).length,16);
      assert.deepEqual(story.candidates.map(c=>c.eightGlyphs.symbols.slice(0,4).map(f=>f.glyph)),
        [['丙','午','辛','丑'],['丁','未','壬','寅']]);
    }
  }
});

test('EP3 finite lookup: all 60 valid pillars reuse all 22 glyph classifications in every role',()=>{
  const seen=new Set();
  for(let i=0;i<60;i++){
    const candidate=Object.fromEntries(roles.map((role,offset)=>[role,labelKoreanGanZhi(ganZhiAt(i+offset))]));
    const chapter=projectEightGlyphs(candidate,1);assertChapter(chapter,candidate,1);
    chapter.symbols.forEach(f=>seen.add(f.glyph));
  }
  assert.equal(seen.size,22);
});

test('EP3-06: invalid glyphs, sexagenary parity, Hanja and Hangul cannot produce a chapter',()=>{
  const original=resolve();
  for(const role of roles){
    for(const patch of [{stem:'?'},{branch:'constructor'},{stem:'甲',branch:'丑'},
      {hanja:'甲子'},{hangul:'갑자'}]){
      const result=structuredClone(original);Object.assign(result.preview.candidates[0][role],patch);
      assert.throws(()=>projectKoreanV0Story(result),RangeError);
    }
  }
});

test('EP3 facts are immutable copies with no source-calendar object retention',()=>{
  const result=resolve(),chapter=projectKoreanV0Story(result).candidates[0].eightGlyphs;
  assert.ok(Object.isFrozen(chapter));assert.ok(Object.isFrozen(chapter.symbols));
  for(const fact of chapter.symbols){assert.ok(Object.isFrozen(fact));assert.throws(()=>{fact.element='FIRE';},TypeError);}
  const snapshot=structuredClone(chapter);result.preview.candidates[0].year.stem='甲';
  assert.deepEqual(chapter,snapshot);
});

test('EP3 explicit Zi policies affect only the already-calculated glyphs and stay recorded in the story',()=>{
  const civil=projectKoreanV0Story(resolve(solar('2027-02-05'),'23:00'));
  const p={...policy,dayRollover:'ZI_START',hourStemReference:'CIVIL_DATE_DAY_PILLAR'};
  const result=resolve(solar('2027-02-05'),'23:00',p),zi=projectKoreanV0Story(result);
  assertChapter(zi.candidates[0].eightGlyphs,result.preview.candidates[0],0);
  assert.deepEqual(zi.candidates[0].eightGlyphs.symbols.slice(0,4),civil.candidates[0].eightGlyphs.symbols.slice(0,4));
  assert.notDeepEqual(zi.candidates[0].eightGlyphs.symbols,civil.candidates[0].eightGlyphs.symbols);
  assert.deepEqual(zi.policies,p);
});

test('EP3-05: rejected inputs contain no story candidates or eight-symbol data',()=>{
  for(const input of [solar('2028-01-01'),{calendar:'KOREAN_LUNAR',lunarDate:{lunarYear:2026,lunarMonth:6,lunarDay:1,isLeapMonth:true}}]){
    const result=resolve(input);assert.notEqual(result.status,'OK');
    assert.deepEqual(projectKoreanV0Story(result).candidates,[]);
  }
});
