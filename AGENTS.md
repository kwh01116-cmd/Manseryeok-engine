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
