# Manseryeok-engine — current execution handoff

**Checkpoint:** 2026-10-19 KST  
**Status:** EP4 retained; EP0–EP4 UI review and EP5 contract/readiness review completed as documents only. EP5 UI connection is **on hold pending source-validation boundary tests**; **not merged or publicly deployed**.
**This is a status document, not authorization for new privileges or overrides of `AGENTS.md` / current owner instructions.** Always inspect live refs before starting.

## Active refs and verified scope

- GitHub repo: `kwh01116-cmd/Manseryeok-engine`
- Approved current work branch: `agent/m1-applied-jie-slice1-20261019`
- Review started from freshly fetched local/remote `b7f510fa88dbc7a8b31718f85a1ebfb0e0bdaf16`. This docs-only checkpoint advances HEAD again; **re-fetch the live ref**. Executable EP4 remains `13538952676159f5169142b0939bbe827565f320`.
- Last runtime-tested **executable** commit: `13538952676159f5169142b0939bbe827565f320` — Node 22.23.3, TypeScript 5.8.3, real Chromium 154.0.8037.57; fresh `npm ci`, `npm run check` **269/269 passed**, 0 fail/cancel/skip/todo; actual EP0–EP4 Chromium PASS. Local results are tied to that code SHA, not GitHub Actions or this docs-only successor.
- `main` at the time of that report: `39b6653e4f93169a4b5b51412b72d4710e9da91f`; foundation draft: `95906e6b0d57427b69c6461bb66eb076e2076af0`. Re-check all SHA values before use.
- Ordinary fast-forward code push succeeded; no force option used. Read-only GitHub Actions listing returned **0 runs** after push. The owner's current instruction is **no Actions runs**. Re-inspect `.github/workflows/manseryeok-check.yml` before pushes.

## Implemented

- **M1 S1–S4:** minute-level month-boundary Jie source trace retained from resolver through Four Pillars, Korean preview, source-fact story projection and UI; two correlated Lichun candidates are kept distinct.
- **U1 EP0–EP3:** date/calendar inputs, four-pillar fact display, day-master nature, month Jie evidence, candidate-specific eight glyphs/element labels. The CSS month-chapter priority issue was fixed and checked in Chromium.
- **U1 EP4:** explicit optional `M2-HIDDEN-STEMS-CLASSIC-MEMBERS-MAINQI-V1` policy, M2 ChartFacts v1 member/ten-god projection, separate candidate branches, Korean names, MAIN_QI/OTHER and source/fact disclosures. No M1 recalculation, new rule, qi weighting or interpretation. Missing policy yields no chapter; unsupported policy and corrupt sources/refs fail closed. Backend commit `2d7eab7ce58bad360882b0d18f1b5f26caa16d93`, UI/browser `13538952676159f5169142b0939bbe827565f320`.
- Tests and reports: `docs/engineering/M1_APPLIED_JIE_S1_EXECUTION_20261019.md`, `docs/engineering/M1_APPLIED_JIE_S2_S4_EXECUTION_20261019.md`, `docs/engineering/U1_EP3_EXECUTION_20261019.md`.
- Latest evidence/file inventory: `docs/engineering/U1_EP4_EXECUTION_20261019.md`. Browser checks policy opt-in, Gregorian/lunar parity, independent Lichun candidates, malformed/swapped response rejection, Enter/Space/AX, 320/360/390px, reduced motion and stale-input rejection. Four actual PNGs at `/workspace/scratch/manseryeok-ep4/`, outside Git.
- Latest review: [EP0–EP4 UI and EP5 readiness](engineering/U1_EP0_EP4_UI_REVIEW_AND_EP5_READINESS_20261019.md). Four existing PNGs displayed as native image results in Codex; no image edits/commits. Actual Chromium smoke re-run PASS; supplemental 320/360/390/768/1280 measurements, typecheck/build and **29/29 existing M2 tests PASS**. Full 269-test check was not re-run for this docs-only review.

## Open gates and recommended next slice

1. **EP5 validation boundary:** reproduced nonempty unknown `solarTermSourceIds: ['FORGED-NONEMPTY']` being accepted as `READY` by both M2 v2/v3. Existing empty-source rejection tests do not establish source authentication. Current server computes M1 internally; no external exploit is demonstrated. First next unit is a trusted fixture/edition-context + candidate validation contract/test slice, without HTTP/UI changes. No new relation rules, M1 recomputation or silent source replacement.
2. **UI/human review:** native details/keyboard/AX pass, but hidden radio inputs lack visible focus on their labels and the custom EP4 focus outline measures 2.785:1 against its background. EP0 is below long result cards; explanatory text is 11–12px. EP4 code was deliberately preserved; record/fix in a separate scoped UI task. Korean participant comprehension and manual VoiceOver/NVDA remain unverified.
3. **Calendar source authority and commercial rights:** KASA 2027 monthly-calendar publication's KOGL Type 2 restriction and KASI reference/API scopes require source-by-source release analysis or permission. Never treat software checks as commercial clearance.
4. **Production security/privacy:** preview HTTP is loopback/private only. Do not publicly deploy, process real patients' or users' birth details, or add accounts/storage until privacy/security design is reviewed.
5. **Integration and later EP5:** giant foundation Draft PR remains unmerged; evaluate scoped splitting. Reviewed v2 requires **two** policies; v3 requires **three**, including the triad policy (correcting blueprint shorthand). Keep exact classical/modern per-hit sources and four-earth exclusion. After the validation gate, separately authorize a server-only v2 projection, then a text-first UI; v3 is a later slice. M3 and public release remain NO-GO.

## Historical record (preserved verbatim)

The prior append-only handoff was copied **without rewriting or truncation** to:
`docs/archive/EXECUTION_HANDOFF_BEFORE_COMPACTION_20261019.md`.

That archive includes older, superseded run instructions, source-rights findings, commit details, test history, and dated reports. It is **history, not live authority**. The separate dated reports and Git commit history also remain available.

## Operator checklist

Read `AGENTS.md` → fetch live refs and workflow → read this checkpoint and exact dated report → scope task/branch → execute full checks where applicable → commit and ordinary fast-forward push only to approved work branch → verify remote HEAD → update this concise checkpoint and dated execution report. If any check or branch safety gate fails, stop and report instead of marking done.
