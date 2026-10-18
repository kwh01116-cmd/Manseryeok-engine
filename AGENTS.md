# Manseryeok-engine engineering rules

This repository is a Korea-first Manseryeok / Myeongli engine. Correctness, provenance, reproducibility, and explicit policy boundaries are more important than speed or feature count.

## Non-negotiable workflow

1. Never make speculative interpretation rules executable just because they are common on the web.
2. Separate deterministic facts from school/policy choices in types and APIs.
3. Any executable classical rule must point to a rule-registry entry with provenance and dispute status before it becomes production logic.
4. Any policy-dependent result must record the policy/version that produced it.
5. Prefer the smallest independently testable slice. Do not perform broad rewrites during an unattended hourly run.
6. Before editing, re-read the current branch/PR state. Continue an existing compatible workstream instead of starting parallel conflicting work.
7. Run `npm run check` for executable changes. If checks cannot be run or fail, do not present the slice as verified and do not merge it.
8. Do not merge to `main` from an unattended run unless all relevant checks are green and the change is narrowly scoped, reversible, and already inside an approved workflow. Prefer a PR.
9. Never weaken a test or evidence gate merely to make a change pass.
10. Korea is the default jurisdiction (`ko-KR`, Korean historical civil time, KASA/KASI source hierarchy). Overseas birth support is an explicit extension, not an implicit default.

## Evidence layers

Keep these distinct:

- astronomical / civil-time fact
- official Korean calendar publication or KASI computational reference
- classical base text
- original commentary
- later commentary
- Korean school/practice
- modern implementation policy / heuristic
- unresolved or disputed rule

Document disagreement rather than silently collapsing it into one answer.

## Quota-paused research mode (2026-10-18)

When the owner reports that GitHub Actions allowance is exhausted, **do not trigger Actions or paid runners** and never weaken/remove the existing checks to fake a green state. The currently reviewed workflow on `agent/foundation-20261006` runs on pushes touching `src/**`, `test/**`, `scripts/**`, `web/**`, `package*.json`, `tsconfig.json` or the workflow itself. During this pause, restrict pushes to **docs-only** paths (plus carefully scoped `README.md`/`AGENTS.md` text), verify latest workflow and PR head before every push, and use optimistic expected-SHA branch leases. New executable changes require a runnable environment and exact-SHA checks before claiming verified. Reference `docs/operations/NO_ACTIONS_QUOTA_OFFLINE_WORK_PROTOCOL_20261018.md`.

The latest verified code SHA is `891967bfd2883e4aed8296a27b96d9be8a94ee11` (227/227 Node tests and actual Chromium passed). Later research docs do **not** change this evidence. The 2027 official KASA 월력요항 document displays KOGL Type 2 noncommercial licensing: source, rights and independent astronomical facts must not be conflated; the commercial-use release gate remains open. Before implementing an applied Jie explanation, follow `docs/research/M1_APPLIED_JIE_PROVENANCE_DESIGN_20261018.md`; do not claim corpus-wide source IDs are the birth's exact applied event evidence.
