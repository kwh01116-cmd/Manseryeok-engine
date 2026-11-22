import { PRODUCT_STRENGTH_METADATA, isIssuedProductStrength, type ProductStrengthAssessment } from "../e1/productStrengthV1.js";
import { areStemCombinationPartners } from "../domain/stemCombinations.js";
import { fiveElementRelation } from "../domain/tenGods.js";
import { validateM4InnerPatterns, type M4InnerPatternsResult } from "../m4/innerPatternsV1.js";
import type { M3EvidenceResult, M3InputEnvelope, M3StemLocation } from "../m3/structuralEvidenceV1.js";

export const PATTERN_RULES_POLICY_ID = "E3-NATAL-PATTERN-CONDITIONS-V01" as const;
export const PATTERN_RULES_VERSION = "0.1.0" as const;
const sourceRefs = Object.freeze(["ZPZQ-SHEN-CH9-CHENGBAI", "ZPZQ-XU-CH9-EXAMPLES", "E3-PROJECT-NATAL-LOCAL-CHANNELS"] as const);
const resourceRouteSourceRef = "ZPZQ-SHEN-XU-CH39-PIANGUAN";
const roles = ["year", "month", "day", "hour"] as const;
type Pattern = M4InnerPatternsResult["candidates"][number]["patterns"][number];
type Parent = M3EvidenceResult["candidates"][number];
type M2Chart = M3InputEnvelope["candidates"][number];
type Loc = M3StemLocation;
type Term = Loc | null;
type Tri = "TRUE" | "FALSE" | "UNKNOWN";
type RuleStatus = "OUT_OF_SCOPE" | "NOT_TRIGGERED" | "RULE_SATISFIED" | "UNRESOLVED";
type ConflictingGrades = "STRONG" | "WEAK";
type PolicyGrade = Readonly<{grade: ProductStrengthAssessment["grade"]; supportUnits: number; specialReview: boolean}>;
type Condition = ReturnType<typeof condition>;
type Path = ReturnType<typeof path>;

interface RuleDefinition {
  id: string;
  target: "FORMATION" | "INTERFERENCE" | "RESCUE";
  applies: readonly Pattern["patternType"][];
  requiredGrade?: ConflictingGrades;
}
const officer = ["正官"] as const, wealth = ["正財", "偏財"] as const, killings = ["七殺"] as const;
const rules = [
  { id: "OFFICER_RESOURCE_SUPPORT", target: "FORMATION", applies: officer },
  { id: "OFFICER_HURT_PRESSURE", target: "INTERFERENCE", applies: officer },
  { id: "OFFICER_RESOURCE_RESCUE", target: "RESCUE", applies: officer },
  { id: "WEALTH_FOOD_FORMATION", target: "FORMATION", applies: wealth, requiredGrade: "STRONG" },
  { id: "WEALTH_ROBBER_PRESSURE", target: "INTERFERENCE", applies: wealth },
  { id: "WEALTH_FOOD_RESCUE", target: "RESCUE", applies: wealth },
  { id: "KILLINGS_FOOD_CONTROL", target: "FORMATION", applies: killings },
  { id: "KILLINGS_RESOURCE_INTERFERENCE", target: "INTERFERENCE", applies: killings },
  { id: "KILLINGS_RESOURCE_ROUTE", target: "RESCUE", applies: killings, requiredGrade: "WEAK" },
] as const satisfies readonly RuleDefinition[];

function check(ok: unknown, code: string): asserts ok { if (!ok) throw new RangeError(code); }
function freeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}
const unique = <T>(values: readonly T[]) => [...new Set(values)].sort();
const truth = (value: boolean): Tri => value ? "TRUE" : "FALSE";
const positions = (values: readonly Term[]) => values.filter((x): x is Loc => x !== null);
const locRefs = (values: readonly Term[]) => positions(values).flatMap(x => x.inputFactRefs);
const locIds = (values: readonly Term[]) => positions(values).map(x => x.locationId);
const uniqueLocations = (values: readonly Loc[]) => [...new Map(values.map(x => [x.locationId, x])).values()];
const near = (left: Loc, right: Loc) => Math.abs(roles.indexOf(left.pillarRole) - roles.indexOf(right.pillarRole)) <= 1;
const related = (left: Loc, right: Loc, relation: "DAY_MASTER_GENERATES" | "DAY_MASTER_CONTROLS") =>
  left.locationId !== right.locationId && near(left,right) && fiveElementRelation(left.element,right.element) === relation;
const generates = (left: Loc, right: Loc) => related(left,right,"DAY_MASTER_GENERATES");
const controls = (left: Loc, right: Loc) => related(left,right,"DAY_MASTER_CONTROLS");
const stemRef = (loc: Loc) => ({ locationRef: loc.locationId, role: loc.pillarRole, kind: loc.locationKind,
  position: loc.position, stem: loc.stem, tenGod: loc.tenGod, memberRef: loc.inputMemberRef, factRefs: loc.inputFactRefs });
const condition = (conditionId: string, value: Tri, reason: string, factRefs: readonly string[],
  witnessRefs: readonly string[] = []) => ({conditionId,value,reason,factRefs:unique(factRefs),witnessRefs:unique(witnessRefs)});
function state(values: readonly Tri[]): RuleStatus {
  if (values.includes("FALSE")) return "NOT_TRIGGERED";
  if (values.includes("UNKNOWN")) return "UNRESOLVED";
  return "RULE_SATISFIED";
}
function path(anchor: Loc, rolesUsed: readonly Term[], conditions: readonly Condition[], details: object = {}) {
  return {anchor:stemRef(anchor), locations:positions(rolesUsed).map(stemRef),
    conditions, status:state(conditions.map(c => c.value)), details};
}
function aggregate(paths: readonly {status: RuleStatus}[]): RuleStatus {
  if (paths.some(p=>p.status==="RULE_SATISFIED")) return "RULE_SATISFIED";
  if (paths.some(p=>p.status==="UNRESOLVED")) return "UNRESOLVED";
  return "NOT_TRIGGERED";
}
function gradeCondition(required: ConflictingGrades, grade: PolicyGrade | undefined, factRefs: readonly string[]) {
  const validDirection = grade && !grade.specialReview && grade.grade !== "BORDERLINE";
  return condition("E1_DIRECTION_"+required, validDirection ? truth(grade.grade===required) : "UNKNOWN",
    !grade ? "E1_REQUIRED" : grade.specialReview ? "E1_SPECIAL_REVIEW" : "E1_"+grade.grade, factRefs);
}

/** Unit lookup for the E3 root predicate. The evaluator supplies authenticated hidden locations. */
export function matchPatternRootLocations(target: Pick<Loc, "stem" | "element"> | null, hidden: readonly Loc[]) {
  const matches = target ? uniqueLocations(hidden.filter(x=>x.element===target.element)) : [];
  return {
    exact:matches.filter(x=>x.stem===target?.stem),
    sameElementDifferentStem:matches.filter(x=>x.stem!==target?.stem),
  };
}

type Options = { readonly policyId: string; readonly policyVersion: string; readonly strength?: ProductStrengthAssessment };
function verifyStrength(candidate: M2Chart, strength: ProductStrengthAssessment) {
  check(isIssuedProductStrength(strength), "E3_ISSUED_STRENGTH_REQUIRED");
  check(strength.candidateRef === candidate.id && strength.inputFacts.every((x,i) => {
    const p = candidate.pillars[i];
    return p && p.role === x.role && p.stem === x.stem && p.branch === x.branch;
  }), "E3_STRENGTH_FOREIGN_CANDIDATE");
}
function assessRoutes(parent: Parent, m2: M2Chart, pattern: Pattern, rule: RuleDefinition, base?: PolicyGrade): Path[] {
  const locations = uniqueLocations(Object.values(parent.directionalGroups).flat());
  const visible = locations.filter(x=>x.locationKind==="VISIBLE_STEM");
  const visiblePlusDay = [...visible, parent.visibleDayMaster];
  const hidden = locations.filter(x=>x.locationKind==="HIDDEN_STEM");
  const anchors = uniqueLocations([...pattern.monthMembers, ...pattern.exactExposures.map(e=>e.visible)]);
  const surfaceRefs = locRefs(visiblePlusDay);
  const rootRefs = locRefs(hidden);
  const premise = (id: string, ok: boolean, used: readonly Term[], inventory: readonly string[]=surfaceRefs) =>
    condition(id,truth(ok),ok ? "LOCAL_DIRECTION_OBSERVED" : "LOCAL_DIRECTION_NOT_OBSERVED", [...locRefs(used), ...inventory], locIds(used));
  const alternatives = (value: Loc[]) => value.length ? value : [null];
  const gradeFactRefs = m2.facts.filter(f=>f.kind==="PILLAR_NATURE" || f.kind==="HIDDEN_STEMS" || f.kind==="VISIBLE_TEN_GOD").map(f=>f.id);
  const branchPairFacts = m2.facts.filter(f=>f.kind==="BRANCH_RELATION");
  const directlyClashed = (x: Loc) => parent.relationContext.pairs.flatMap((p,i) =>
    p.kind==="LIUCHONG" && (p.leftPillarRole===x.pillarRole || p.rightPillarRole===x.pillarRole) ? [branchPairFacts[i]!.id] : []);
  function root(needed: Term) {
    const {exact,sameElementDifferentStem} = matchPatternRootLocations(needed,hidden);
    const stableRoot = exact.some(x=>directlyClashed(x).length===0);
    const clashes = exact.flatMap(directlyClashed);
    const found = Boolean(exact.length);
    const refs = [...locRefs([needed]), ...rootRefs];
    return {
      conditions: [
        condition("EXACT_HIDDEN_ROOT",truth(found),found ? "EXACT_STEM_PRESENT" : "NO_EXACT_HIDDEN_STEM",refs,locIds(exact)),
        condition("ROOT_BRANCH_CLASH_EFFECT", found && !stableRoot ? "UNKNOWN" : "TRUE",
          found && !stableRoot ? "ALL_EXACT_ROOTS_HAVE_CLASH_EFFECT_UNASSESSED" : "NO_BLOCKING_CLASH_UNDER_RULE", [...refs,...clashes],locIds(exact)),
      ],
      witness: {exact:exact.map(stemRef),sameElementDifferentStem:sameElementDifferentStem.map(stemRef),clashes:unique(clashes)},
    };
  }
  function pairGuard(pathLocations: readonly Term[]) {
    const onPath = new Set(locIds(positions(pathLocations).filter(l=>l.locationKind==="VISIBLE_STEM")));
    const pairs = visiblePlusDay.flatMap((a,i)=>visiblePlusDay.slice(i+1).filter(b=>(onPath.has(a.locationId)||onPath.has(b.locationId)) &&
      near(a,b) && areStemCombinationPartners(a.stem,b.stem)).map(b=>[a,b]));
    return condition("RELATED_STEM_COMBINATION_EFFECT",pairs.length ? "UNKNOWN" : "TRUE",
      pairs.length ? "ON_PATH_STEM_COMBINATION_EFFECT_UNASSESSED" : "NO_NEAR_ON_PATH_STEM_COMBINATION",surfaceRefs,pairs.flatMap(locIds));
  }
  const ofGod = (...gods: string[]) => visible.filter(x=>x.tenGod!==null && gods.includes(x.tenGod));
  const resources = ofGod("正印","偏印"), wealthStems = ofGod("正財","偏財");
  const competingGods = pattern.patternType==="正官" ? ["正財","偏財","七殺"] :
    pattern.patternType==="七殺" ? ["正官","正財","偏財"] : ["正印","偏印","七殺"];
  function competition(pivot: Term) {
    const exposures = pivot ? pattern.competition.exposures.filter(e=>e.visible.tenGod!==null &&
      competingGods.includes(e.visible.tenGod) && near(e.visible,pivot)) : [];
    return condition("NEAR_COMPETING_EXPOSURE",exposures.length ? "UNKNOWN" : "TRUE",
      exposures.length ? "EXCLUSIVE_DUTY_UNASSESSED" : "NO_SELECTED_LOCAL_COMPETITOR",
      [...locRefs([pivot]), ...pattern.assessment.inputFactRefs, ...exposures.flatMap(x=>x.inputFactRefs)],exposures.map(e=>e.id));
  }
  const adverse = (id: string, rivals: readonly Loc[]) =>
    condition(id,rivals.length ? "UNKNOWN" : "TRUE",rivals.length ? "COMPETING_DIRECTION_EFFECT_UNASSESSED" : "NO_LOCAL_COMPETING_DIRECTION",
      [...surfaceRefs,...locRefs(rivals)],locIds(rivals));
  return anchors.flatMap(anchor=>{
    const hurt = ofGod("傷官").filter(x=>controls(x,anchor));
    const robber = ofGod("劫財").filter(x=>controls(x,anchor));
    const foodToWealth = ofGod("食神").filter(x=>generates(x,anchor));
    const foodToKillings = ofGod("食神").filter(x=>controls(x,anchor));
    const resourceFromAnchor = resources.filter(x=>generates(anchor,x));
    const suppressingResources = (food: Term, candidates = resources) => food ? candidates.filter(r=>controls(r,food)) : [];
    switch(rule.id) {
      case "OFFICER_HURT_PRESSURE":
      case "WEALTH_ROBBER_PRESSURE": {
        const attackers = rule.id==="OFFICER_HURT_PRESSURE" ? hurt : robber;
        return alternatives(attackers).map(a=>path(anchor,[a],[
          premise("LOCAL_SURFACE_ATTACK",a!==null,[anchor,a]),pairGuard([anchor,a]),
        ]));
      }
      case "OFFICER_RESOURCE_SUPPORT":
      case "OFFICER_RESOURCE_RESCUE":
        return alternatives(resourceFromAnchor).flatMap(resource=>{
          const isRescue = rule.target==="RESCUE";
          const rooted = root(resource);
          const model = [
            premise("OFFICER_TO_SURFACE_RESOURCE",resource!==null,[anchor,resource]),...rooted.conditions,
            adverse("WEALTH_PRESSURE_ON_RESOURCE",resource ? wealthStems.filter(w=>controls(w,resource)) : []),competition(resource),
          ];
          if (!isRescue) return [path(anchor,[resource],[
            ...model,adverse("LOCAL_OFFICER_HURT",hurt),pairGuard([anchor,resource]),
          ],{roots:rooted.witness})];
          return alternatives(hurt).map(hurter=>path(anchor,[hurter,resource],[
            ...model,premise("SAME_OFFICER_HURT_AND_RESOURCE",Boolean(hurter && resource),[anchor,hurter,resource]),
            premise("RESOURCE_TO_SAME_HURTER",Boolean(resource && hurter && controls(resource,hurter)),[resource,hurter]),
            pairGuard([anchor,hurter,resource]),
          ],{roots:rooted.witness}));
        });
      case "WEALTH_FOOD_FORMATION":
      case "WEALTH_FOOD_RESCUE":
        return alternatives(foodToWealth).flatMap(food=>{
          const rooted = root(food);
          const model = [
            premise("SURFACE_FOOD_TO_WEALTH",food!==null,[anchor,food]),...rooted.conditions,
            adverse("INDIRECT_RESOURCE_PRESSURE_ON_FOOD",suppressingResources(food,ofGod("偏印"))),competition(food),
          ];
          if (rule.requiredGrade) return [path(anchor,[food],[
            ...model,pairGuard([anchor,food]),gradeCondition(rule.requiredGrade,base,gradeFactRefs),
          ],{roots:rooted.witness})];
          return alternatives(robber).map(thief=>path(anchor,[thief,food],[
            ...model,premise("SAME_WEALTH_ROBBER_AND_FOOD",Boolean(thief && food),[anchor,thief,food]),
            premise("ROBBER_TO_SAME_FOOD",Boolean(thief && food && generates(thief,food)),[thief,food]),pairGuard([anchor,thief,food]),
          ],{roots:rooted.witness}));
        });
      case "KILLINGS_FOOD_CONTROL":
        return alternatives(foodToKillings).map(food=>{
          const rooted = root(food);
          return path(anchor,[food],[
            premise("SURFACE_FOOD_TO_KILLINGS",food!==null,[anchor,food]),...rooted.conditions,
            adverse("RESOURCE_PRESSURE_ON_FOOD",suppressingResources(food)),
            adverse("WEALTH_FEEDS_KILLINGS",wealthStems.filter(w=>generates(w,anchor))),
            competition(food),pairGuard([anchor,food]),
          ],{roots:rooted.witness});
        });
      case "KILLINGS_RESOURCE_INTERFERENCE":
        return alternatives(foodToKillings).flatMap(food=>alternatives(suppressingResources(food)).map(resource=>{
          const rooted = root(resource);
          return path(anchor,[food,resource],[
            premise("SURFACE_FOOD_TO_KILLINGS",food!==null,[anchor,food]),
            premise("RESOURCE_TO_SAME_FOOD",resource!==null,[resource,food]),...rooted.conditions,pairGuard([anchor,food,resource]),
          ],{roots:rooted.witness});
        }));
      case "KILLINGS_RESOURCE_ROUTE":
        return alternatives(resourceFromAnchor).map(resource=>{
          const rooted = root(resource);
          const cutsResource = resource ? wealthStems.filter(w=>controls(w,resource)) : [];
          const feedsKillings = wealthStems.filter(w=>generates(w,anchor));
          const dual = cutsResource.filter(w=>feedsKillings.includes(w));
          return path(anchor,[resource,parent.visibleDayMaster],[
            premise("KILLINGS_TO_SURFACE_RESOURCE",resource!==null,[anchor,resource]),
            premise("RESOURCE_TO_DAY_MASTER",Boolean(resource && generates(resource,parent.visibleDayMaster)),[resource,parent.visibleDayMaster]),
            ...rooted.conditions,
            adverse("WEALTH_PRESSURE_ON_RESOURCE",cutsResource),adverse("WEALTH_FEEDS_KILLINGS",feedsKillings),
            competition(resource),pairGuard([anchor,resource,parent.visibleDayMaster]),
            gradeCondition("WEAK",base,gradeFactRefs),
          ],{roots:rooted.witness,wealthControlsResource:cutsResource.map(stemRef),
            wealthFeedsKillings:feedsKillings.map(stemRef),dualWealth:dual.map(stemRef)});
        });
      default: throw new RangeError("E3_RULE_UNKNOWN");
    }
  });
}

function conditionSummary(paths: readonly Path[]) {
  const definitions = new Map(paths.flatMap(p=>p.conditions.map(c=>[c.conditionId,c] as const)));
  return [...definitions.keys()].map(id=>{
    const occurrences = paths.flatMap(p=>p.conditions.filter(c=>c.conditionId===id));
    const values = occurrences.map(c=>c.value);
    const uniform = values.every(v=>v===values[0]);
    return {conditionId:id, value:uniform ? values[0]! : "UNKNOWN" as const, variesByPath:!uniform,
      factRefs:unique(occurrences.flatMap(c=>c.factRefs)), reasons:unique(occurrences.map(c=>c.reason))};
  });
}
function assess(parent: Parent, m2: M2Chart, pattern: Pattern, rule: RuleDefinition, strength?: ProductStrengthAssessment) {
  const scope = pattern.assessment.status;
  const inputGrade = strength ? {grade:strength.grade,supportUnits:strength.score.supportUnits,specialReview:strength.specialReview} : undefined;
  const paths = scope==="STRUCTURAL_CANDIDATE" ? assessRoutes(parent,m2,pattern,rule,inputGrade) : [];
  const status: RuleStatus = scope==="SOURCE_OR_POLICY_UNRESOLVED" ? "UNRESOLVED" :
    scope==="NOT_A_CANDIDATE_UNDER_POLICY" ? "OUT_OF_SCOPE" : aggregate(paths);
  const conditions = conditionSummary(paths);
  const strengthDependency = rule.requiredGrade ? {policyId:PRODUCT_STRENGTH_METADATA.policyId,policyVersion:PRODUCT_STRENGTH_METADATA.policyVersion,
    requiredGrade:rule.requiredGrade,base:inputGrade??null} : null;
  return {
    ruleId:rule.id, ruleVersion:PATTERN_RULES_VERSION, policyId:PATTERN_RULES_POLICY_ID, policyVersion:PATTERN_RULES_VERSION,
    candidateRef:parent.candidateRef, patternRef:pattern.assessment.id, patternType:pattern.patternType,
    target:rule.target,status,scope,
    sourceRefs:rule.id==="KILLINGS_RESOURCE_ROUTE" ? [...sourceRefs,resourceRouteSourceRef] : sourceRefs,
    ruleAuthority:"PROJECT_POLICY" as const, conditions, paths,strengthDependency,
    satisfiedConditions:conditions.filter(c=>c.value==="TRUE").map(c=>c.conditionId),
    failedConditions:conditions.filter(c=>c.value==="FALSE").map(c=>c.conditionId),
    unresolvedConditions:conditions.filter(c=>c.value==="UNKNOWN"&&!c.variesByPath).map(c=>c.conditionId),
    factRefs:unique([...pattern.assessment.inputFactRefs,...conditions.flatMap(c=>c.factRefs)]),
    holdReasons:scope==="SOURCE_OR_POLICY_UNRESOLVED" ? [pattern.assessment.basis] :
      status==="UNRESOLVED" ? unique(paths.filter(p=>p.status==="UNRESOLVED").flatMap(p=>p.conditions.filter(c=>c.value==="UNKNOWN").map(c=>c.reason))) : [],
  };
}
type Rule = ReturnType<typeof assess>;
function summarize(rows: readonly Pick<Rule,"ruleId"|"status"|"patternRef"|"target"|"paths">[]) {
  const usable = (status: RuleStatus) => status==="RULE_SATISFIED"||status==="UNRESOLVED";
  const direct = rows.find(r=>r.ruleId==="KILLINGS_FOOD_CONTROL" && r.paths.length && usable(r.status));
  const mediation = rows.find(r=>r.ruleId==="KILLINGS_RESOURCE_ROUTE" && r.paths.length && usable(r.status) && r.patternRef===direct?.patternRef);
  const competition = direct && mediation ? [{patternRef:direct.patternRef,paths:[direct,mediation]}] : [];
  const qualifications = rows.filter(r=>r.target!=="INTERFERENCE" && r.paths.length && usable(r.status));
  const qualificationRefs = unique(qualifications.map(r=>r.patternRef));
  if (qualificationRefs.length>1) {
    competition.push({patternRef:"MULTIPLE_MONTHLY_CANDIDATES", paths:qualifications});
  }
  const status = competition.length ? "COMPETING_RULES" as const : rows.some(p=>p.status==="RULE_SATISFIED") ? "RULE_SATISFIED" as const
    : rows.some(p=>p.status==="UNRESOLVED") ? "UNRESOLVED" as const
    : rows.some(p=>p.status==="NOT_TRIGGERED") ? "NOT_TRIGGERED" as const : "OUT_OF_SCOPE" as const;
  return {status,competition:competition.map(group=>({patternRef:group.patternRef,
    paths:group.paths.map(({ruleId,status,patternRef,target})=>({ruleId,status,patternRef,target}))}))};
}

export function evaluatePatternRulesV1(inner: M4InnerPatternsResult, evidence: M3EvidenceResult,
  m2Facts: M3InputEnvelope, candidateIndex: number, options: Options) {
  check(options?.policyId===PATTERN_RULES_POLICY_ID && options.policyVersion===PATTERN_RULES_VERSION,"E3_EXPLICIT_PATTERN_POLICY_REQUIRED");
  check(evidence && m2Facts,"E3_M2_AND_M3_REQUIRED");
  validateM4InnerPatterns(inner,{evidence,m2Facts});
  const parent=evidence.candidates[candidateIndex], m2=m2Facts.candidates[candidateIndex], m4=inner.candidates[candidateIndex];
  check(Number.isSafeInteger(candidateIndex) && candidateIndex>=0 && parent && m2 && m4 &&
    m4.candidateRef===m2.id && parent.candidateRef===m2.id, "E3_CANDIDATE_REQUIRED");
  const strength=options.strength;
  if(strength!==undefined) verifyStrength(m2,strength);
  const rows=rules.flatMap(rule=>m4.patterns.filter(p=>(rule.applies as readonly string[]).includes(p.patternType))
    .map(pattern=>assess(parent,m2,pattern,rule,strength)));
  const summary=summarize(rows);
  const probes=strength ? [...strength.sensitivity.probes,strength.sensitivity.stressOnly] : [];
  const sensitivity=probes.map(probe=>{
    const units=probe.supportUnits;
    const specialReview=units<=PRODUCT_STRENGTH_METADATA.specialAtOrBelowUnits || units>=PRODUCT_STRENGTH_METADATA.specialAtOrAboveUnits;
    const variant={grade:probe.grade,supportUnits:units,specialReview};
    const changes=rows.flatMap(r=>{
      const dep=r.strengthDependency;
      if (!dep || !r.paths.length) return [];
      const base=gradeCondition(dep.requiredGrade,dep.base??undefined,[]);
      const alt=gradeCondition(dep.requiredGrade,variant,[]);
      if (base.value===alt.value && base.reason===alt.reason) return [];
      const status=aggregate(r.paths.map(p=>({status:state(p.conditions.map(c=>c.conditionId===alt.conditionId ? alt.value : c.value))})));
      return [{ruleId:r.ruleId,patternRef:r.patternRef,conditionId:alt.conditionId,baseValue:base.value,value:alt.value,
        baseReason:base.reason,reason:alt.reason,baseStatus:r.status,status}];
    });
    const alternate=rows.map(r=>({...r,status:changes.find(c=>c.ruleId===r.ruleId && c.patternRef===r.patternRef)?.status??r.status}));
    return {probeId:probe.id,kind:probe===strength?.sensitivity.stressOnly ? "STRESS_ONLY" as const : "LOCAL_PROBE" as const,
      baselineStatus:summary.status,status:summarize(alternate).status,grade:probe.grade,supportUnits:units,specialReview,changes};
  });
  return freeze({schemaVersion:"engine-e3-natal-pattern-conditions-v1",candidateRef:m2.id,policyId:PATTERN_RULES_POLICY_ID,
    policyVersion:PATTERN_RULES_VERSION,...summary,rules:rows,sensitivity,sourceRefs:unique(rows.flatMap(r=>r.sourceRefs)),
    factRefs:unique(rows.flatMap(r=>r.factRefs)),
    limitations:["RULE_RESULTS_APPLY_TO_SELECTED_NATAL_CONDITIONS","ROOT_FORCE_AND_ACTUAL_TRANSFER_UNASSESSED",
      "ACTUAL_PATTERN_EFFICACY_NOT_CERTIFIED","EOKBU_ORDER_AND_CANDIDATES_UNCHANGED"]});
}
