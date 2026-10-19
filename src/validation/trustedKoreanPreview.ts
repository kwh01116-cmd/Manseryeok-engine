import { resolveKoreanBirthChartPreview, type KoreanBirthChartPreviewResult,
  type KoreanBirthDateInput } from "../calendar/koreanBirthPreview.js";
import type { ModernKoreanCivilTimePolicy } from "../calendar/fourPillars.js";
import type { FullYearSolarTermCoverageManifest } from "../calendar/solarTermCoverage.js";
import { KOREA_SOLAR_TERM_EVENTS_2026_2027 } from "../calendar/koreaSolarTermFixtures.js";
import { KASI_KOREAN_LUNISOLAR_2025_2027 } from "../calendar/koreanLunisolarFixtures.js";
import { createKoreanLunisolarConverter } from "../calendar/koreanLunisolarConverter.js";
import { copyValidatedKoreanMonthBoundaryTrace } from "../calendar/koreanMonthBoundaryTrace.js";
import { deriveM2ChartFacts } from "../chartFacts/chartFactsV1.js";
import { deriveM2ChartFactsV2 } from "../chartFacts/chartFactsV2.js";
import { deriveM2ChartFactsV3 } from "../chartFacts/chartFactsV3.js";
import type { HiddenStemPolicyId } from "../domain/hiddenStems.js";
import type { BranchRelationsPolicyId } from "../domain/branchRelations.js";
import type { TriadMembershipPolicyId } from "../domain/triadMemberships.js";

const manifest: FullYearSolarTermCoverageManifest = Object.freeze({
  schemaVersion:"m1-solar-term-coverage-v1", requirementProfile:"FULL_24_TERM_YEAR",
  timeBasis:"KST", sourcePrecision:"MINUTE",
  supportedFromInclusive:"2026-01-01T00:00", supportedUntilExclusive:"2028-01-01T00:00",
  requiredYears:Object.freeze([2026,2027]),
  requiredPriorBoundary:Object.freeze({year:2025,term:"DAXUE"}),
});
const corpus = KASI_KOREAN_LUNISOLAR_2025_2027;
const events = KOREA_SOLAR_TERM_EVENTS_2026_2027;
const converter = createKoreanLunisolarConverter(corpus);
const corpusSourceIds = Object.freeze([...new Set(events.flatMap(e=>e.sourceIds))].sort());

/** Selected repository editions, NOT scholarly authentication or reuse clearance. */
export const KOREAN_LAB_PREVIEW_CONTEXT = Object.freeze({
  schemaVersion:"m1-trusted-lab-context-v1" as const,
  profileId:"KOREAN-LAB-KASI-2026-2027-V1" as const,
  guarantee:"SELECTED_FIXTURE_AND_EXECUTION_CONSISTENCY_ONLY" as const,
  manifest,
  solarTermCorpusId:"m1-kasi-solar-term-corpus-v1" as const,
  solarTermSourceIds:corpusSourceIds,
  // Annual KASI calendar-page editions already recorded by the selected corpus.
  annualCalendarEditions:Object.freeze({...corpus.sourceEditions}),
  lunarCorpusId:corpus.corpusId,
  lunarSourceId:corpus.sourceId,
  authorityLevel:corpus.authorityLevel,
});

export interface TrustedKoreanLabPreviewReceipt {
  readonly context: typeof KOREAN_LAB_PREVIEW_CONTEXT;
  readonly result: KoreanBirthChartPreviewResult;
}

// Opaque at runtime: copying the receipt's public fields does not register a receipt.
// Weak keys avoid a global birth-record store. Receipts are request-local capabilities,
// not portable signatures, persistence tokens or permission to trust another process.
const issued = new WeakMap<TrustedKoreanLabPreviewReceipt,KoreanBirthChartPreviewResult>();
function invalid(): never { throw new RangeError("Untrusted M1 preview or execution receipt."); }

function frozenCopy<T>(value:T):T {
  if (Array.isArray(value)) return Object.freeze(value.map(item=>frozenCopy(item))) as T;
  if (value && typeof value === "object") {
    return Object.freeze(Object.fromEntries(Object.entries(value).map(([k,v])=>[k,frozenCopy(v)]))) as T;
  }
  return value;
}

/** Compare plain JSON data without coercion, toJSON, getters, or key-order assumptions. */
function sameData(actual:unknown, expected:unknown):boolean {
  if (actual === expected) return true;
  if (!actual || !expected || typeof actual !== "object" || typeof expected !== "object") return false;
  if (Array.isArray(actual) !== Array.isArray(expected)) return false;
  const prototype = Object.getPrototypeOf(actual);
  if (prototype !== (Array.isArray(actual) ? Array.prototype : Object.prototype)) return false;
  const keys = Reflect.ownKeys(expected);
  if (Reflect.ownKeys(actual).length !== keys.length) return false;
  return keys.every(key=>{
    const a = Object.getOwnPropertyDescriptor(actual,key);
    const b = Object.getOwnPropertyDescriptor(expected,key)!;
    return !!a && "value" in a && sameData(a.value,b.value);
  });
}

/** Independent provenance/shape check against the server-selected fixed context. */
function validateSelectedContext(result:KoreanBirthChartPreviewResult):void {
  if (result.status !== "OK") return;
  const p=result.preview;
  if (p.schemaVersion !== "v0-korean-birth-chart-preview-v1" || p.locale !== "ko-KR" ||
      p.confidenceScope !== "PUBLISHED_MINUTE_COMPARISON_ONLY" ||
      !sameData(p.solarTermSourceIds,corpusSourceIds) ||
      !sameData(p.coverage,{
        validation:"STRUCTURAL_COVERAGE_ONLY", requirementProfile:manifest.requirementProfile,
        supportedFromInclusive:manifest.supportedFromInclusive,
        supportedUntilExclusive:manifest.supportedUntilExclusive,
      }) || !p.monthBoundaryTrace) invalid();
  if (p.input.calendar === "KOREAN_LUNAR") {
    if (!sameData(p.lunarConversionSource,{
      sourceId:corpus.sourceId,authorityLevel:corpus.authorityLevel,corpusId:corpus.corpusId,
    })) invalid();
  } else if (Object.hasOwn(p,"lunarConversionSource")) invalid();
  // An event must match its exact fixture record. The corpus's source union cannot
  // stand in for an applied event; preserve the correlated candidate/fact namespace.
  copyValidatedKoreanMonthBoundaryTrace(p.monthBoundaryTrace,p,events);
}

/**
 * Sole M1 calculation for a request. No caller-supplied fixtures, manifest,
 * source allow-list, edition declaration or resolver callback enters this gate.
 * This modern Lab profile does not promote research 2000 or historical time.
 */
export function resolveTrustedKoreanLabPreview(
  input:KoreanBirthDateInput, clock:string, policies:ModernKoreanCivilTimePolicy,
):TrustedKoreanLabPreviewReceipt {
  // Check even blocked dates: an unknown policy must never be disguised as coverage.
  if (!policies || policies.timeBasis !== "KOREAN_CIVIL_TIME" ||
      !["CIVIL_MIDNIGHT","ZI_START"].includes(policies.dayRollover) ||
      !["SELECTED_DAY_PILLAR","CIVIL_DATE_DAY_PILLAR"].includes(policies.hourStemReference) ||
      !sameData(Object.keys(policies).sort(),["dayRollover","hourStemReference","timeBasis"])) invalid();
  const result=resolveKoreanBirthChartPreview(input,clock,policies,converter,events,manifest);
  validateSelectedContext(result);
  const snapshot=frozenCopy(result);
  const receipt=Object.freeze({context:KOREAN_LAB_PREVIEW_CONTEXT,result:snapshot});
  issued.set(receipt,snapshot);
  return receipt;
}

/**
 * Verify against a receipt issued by the one trusted execution, without running M1
 * again. A fully self-consistent foreign candidate is still rejected. Unchanged
 * serialized JSON is accepted; any missing/changed/extra data is rejected, never
 * silently repaired. Returning the immutable equal snapshot is not correction.
 */
export function verifyTrustedKoreanLabPreview(
  receipt:TrustedKoreanLabPreviewReceipt, candidate:unknown,
):KoreanBirthChartPreviewResult {
  const expected=issued.get(receipt);
  if (!expected || !sameData(candidate,expected)) invalid();
  return expected;
}

/** Strict alternatives to the generic M2 adapters, which assume trusted M1 input. */
export function deriveTrustedM2ChartFacts(
  receipt:TrustedKoreanLabPreviewReceipt, candidate:unknown, hidden:HiddenStemPolicyId,
):ReturnType<typeof deriveM2ChartFacts> {
  return deriveM2ChartFacts(verifyTrustedKoreanLabPreview(receipt,candidate),hidden);
}
export function deriveTrustedM2ChartFactsV2(
  receipt:TrustedKoreanLabPreviewReceipt, candidate:unknown,
  hidden:HiddenStemPolicyId, relations:BranchRelationsPolicyId,
):ReturnType<typeof deriveM2ChartFactsV2> {
  return deriveM2ChartFactsV2(verifyTrustedKoreanLabPreview(receipt,candidate),hidden,relations);
}
export function deriveTrustedM2ChartFactsV3(
  receipt:TrustedKoreanLabPreviewReceipt, candidate:unknown,
  hidden:HiddenStemPolicyId, relations:BranchRelationsPolicyId, triads:TriadMembershipPolicyId,
):ReturnType<typeof deriveM2ChartFactsV3> {
  return deriveM2ChartFactsV3(verifyTrustedKoreanLabPreview(receipt,candidate),hidden,relations,triads);
}
