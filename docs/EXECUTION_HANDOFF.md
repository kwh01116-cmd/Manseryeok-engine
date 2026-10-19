# Manseryeok-engine — current execution handoff

**Checkpoint:** 2026-10-19 KST  
**Status:** work-branch U1 EP3 coded, locally reported verified, ordinary push confirmed; **not merged or publicly deployed**.  
**This is a status document, not authorization for new privileges or overrides of `AGENTS.md` / current owner instructions.** Always inspect live refs before starting.

## Active refs and verified scope

- GitHub repo: `kwh01116-cmd/Manseryeok-engine`
- Approved current work branch: `agent/m1-applied-jie-slice1-20261019`
- Pre-document-refactor remote HEAD: `87478bb4578d1c5de1e6c4ea5bec261507ddd3ff`. This checkpoint's own later docs-only commit will advance HEAD; **re-fetch the live ref**.
- Last runtime-tested **executable** commit (per Codex execution report): `28eef27835749f5d53ac86b3a9d7b0355c91c918` — Node 22.23.3, TypeScript 5.8.3, real Chromium 154.0.8037.57, `npm run check` **261/261 passed**, no reported failures/skips; browser EP0–EP3 reported PASS. These are **Codex-reported local results**, not a newly run check in this document-refactor commit.
- `main` at the time of that report: `39b6653e4f93169a4b5b51412b72d4710e9da91f`; foundation draft: `95906e6b0d57427b69c6461bb66eb076e2076af0`. Re-check all SHA values before use.
- GitHub Actions was not triggered by those work-branch pushes (Codex-reported 0 runs; prior read-only GH check agreed). The owner's current instruction is **no Actions runs**. Re-inspect `.github/workflows/manseryeok-check.yml` before pushes.

## Implemented

- **M1 S1–S4:** minute-level month-boundary Jie source trace retained from resolver through Four Pillars, Korean preview, source-fact story projection and UI; two correlated Lichun candidates are kept distinct.
- **U1 EP0–EP3:** date/calendar inputs, four-pillar fact display, day-master nature, month Jie evidence, candidate-specific eight glyphs/element labels. The CSS month-chapter priority issue was fixed and checked in Chromium.
- Tests and reports: `docs/engineering/M1_APPLIED_JIE_S1_EXECUTION_20261019.md`, `docs/engineering/M1_APPLIED_JIE_S2_S4_EXECUTION_20261019.md`, `docs/engineering/U1_EP3_EXECUTION_20261019.md`.

## Open gates and recommended next slice

1. **Human review:** Korean comprehension and real screen-reader testing (VoiceOver/NVDA); accessibility-tree smoke is not equivalent to manual assistive-technology QA.
2. **Calendar source authority and commercial rights:** KASA 2027 monthly-calendar publication's KOGL Type 2 restriction and KASI reference/API scopes require source-by-source release analysis or permission. Never treat software checks as commercial clearance.
3. **Production security/privacy:** preview HTTP is loopback/private only. Do not publicly deploy, process real patients' or users' birth details, or add accounts/storage until privacy/security design is reviewed.
4. **Integration:** giant foundation Draft PR remains unmerged; evaluate scoped PR splitting before merging. M2 EP4/EP5 require verified source/policy gates, and M3 strength/用神 remains NO-GO.
5. **Next code task only after review:** take a small independently tested candidate-safe factual UI or accessibility slice, preserving all current tests and source/provenance checks.

## Historical record (preserved verbatim)

The prior append-only handoff was copied **without rewriting or truncation** to:
`docs/archive/EXECUTION_HANDOFF_BEFORE_COMPACTION_20261019.md`.

That archive includes older, superseded run instructions, source-rights findings, commit details, test history, and dated reports. It is **history, not live authority**. The separate dated reports and Git commit history also remain available.

## Operator checklist

Read `AGENTS.md` → fetch live refs and workflow → read this checkpoint and exact dated report → scope task/branch → execute full checks where applicable → commit and ordinary fast-forward push only to approved work branch → verify remote HEAD → update this concise checkpoint and dated execution report. If any check or branch safety gate fails, stop and report instead of marking done.
