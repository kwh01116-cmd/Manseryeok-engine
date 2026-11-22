/** Development replay of publicly transcribed pillars, without natal-time inference. */
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {LITERATURE_CASES,LITERATURE_REVISION,NCC} from '../../test/fixtures/e4-literature-cases-v1.mjs';
import {contextFor,patternV2For} from '../../test/fixtures/e5-pattern-structural.mjs';

const counts = (items,field) => Object.fromEntries([...new Set(items.map(item=>item[field]))].sort()
  .map(key=>[key,items.filter(item=>item[field]===key).length]));
const summarizeRule = ({ruleId,patternType,patternRef,status,previousStatus,comparison,holdReasons,paths}) =>
  ({ruleId,patternType,patternRef,status,previousStatus,comparison,holdReasons,paths:paths.map(path=>({
    anchor:path.observation.anchor,actor:path.observation.actor,exactRoots:path.observation.exactRoots,
    sameElementRoots:path.observation.sameElementRoots,clashedRoots:path.observation.rootClashLocations,
    rivals:path.observation.rivalDirections,competingExposures:path.observation.competingExposures,
    structure:path.structure,efficacy:path.efficacy,
  }))});
export function replayLiteratureV2() {
  const cases=LITERATURE_CASES.map(record=>{
    const source={url:NCC[record.chapter],chapter:record.chapter,layer:record.layer,locator:record.locator};
    if(!record.pillars) return {id:record.id,replay:'NO_REFERENCE_FOR_FULL_REPLAY',source,reason:record.reason};
    const result=patternV2For(contextFor([record.pillars]));
    return {id:record.id,replay:'STRUCTURAL_PILLAR_REPLAY',source,pillars:record.pillars,
      status:result.status,previousStatus:result.previousStatus,competingPatternRefs:result.competingPatternRefs,
      rules:result.rules.map(({ruleId,patternType,patternRef,status,previousStatus,comparison})=>({
        ruleId,patternType,patternRef,status,previousStatus,comparison,
      })),focus:result.rules.filter(rule=>rule.ruleId===record.focus).map(summarizeRule)};
  });
  const issued=cases.filter(row=>row.replay==='STRUCTURAL_PILLAR_REPLAY');
  const rules=issued.flatMap(row=>row.rules);
  const focus=issued.flatMap(row=>row.focus);
  return {
    schemaVersion:'engine-e5-literature-replay-v1',corpusRevision:LITERATURE_REVISION,
    validationScope:'TRANSCRIBED_PILLARS_AND_PROJECT_STRUCTURE_ONLY',
    totals:{records:cases.length,issued:issued.length,unissued:cases.length-issued.length,
      chartStates:counts(issued,'status'),ruleStates:counts(rules,'status'),legacyRuleStates:counts(rules,'previousStatus'),
      comparison:counts(rules,'comparison'),focusStates:counts(focus,'status')},
    cases,
  };
}
if (process.argv[1] && import.meta.url===pathToFileURL(resolve(process.argv[1])).href) {
  process.stdout.write(JSON.stringify(replayLiteratureV2())+'\n');
}
