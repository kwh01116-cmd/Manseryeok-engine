# M2 G8 — Opt-in ChartFacts v3, source-linked 三合/三會 member presence

Status: **code gate GREEN** at `379e6ea28945f8deb47a86c5810234036ed16b92`, [Actions 39096678588](https://github.com/kwh01116-cmd/Manseryeok-engine/actions/runs/39096678588): full typecheck/build, 227/227 Node tests and real Chromium PASS. This is still **internal research**; it is not a consumer release or scientific/transformation certification.

## Data contract

`deriveM2ChartFactsV3(m1Result, hiddenStemPolicyId, branchRelationsPolicyId, triadMembershipPolicyId)` is a non-breaking, explicitly opted-in extension of v2. It requires **all three** versioned school-policy IDs; no default, no fallback for disputed interpretations, and no second calendar calculation.

- It retains all prior M1 coverage/sources/published-minute ambiguity, v1 ten-god facts and hidden stem profiles, v2 directed pair relations and source IDs.
- Every *v3 candidate* has `triadMemberships` copied from the source-gated raw `collectFourPillarTriadMemberships`. Each group lists all expected three members, missing branch, number of **distinct member branches**, and every matching four-pillar index even if a branch occurs in multiple positions.
- A source-addressable `pillarRoles[]` and `pillarFactRefs[]` is attached to every present member, e.g. `preview.candidates[1].month`; the references always use the **corresponding** published-minute boundary candidate and never mix candidate 0/1 members.
- `THREE_DISTINCT_MEMBERS` is not an asserted successful 三合化局/三會成局. `TWO_DISTINCT_MEMBERS` can carry `BIRTH_AND_CENTER`, `CENTER_AND_TOMB`, `BIRTH_AND_TOMB_NOT_HALF_TRINE` or `SANHUI_PARTIAL_MEMBERS`, but no guessed missing branch or good/bad outcome.
- Empty or illegal M1 calendar requests yield immutable typed `BLOCKED` results with no fabricated composition, source metadata or story.
- Rule IDs and separate classical vs modern membership source IDs are exported. Version identity is `m2-chart-facts-v3`, not a silent schema update to v1/v2, `/api/preview` or U1.

## Tests

`test/m2-chart-facts-v3.test.mjs` checks:
1. Real M1 Gregorian 2027-02-05 -> v2 unchanged -> v3 added refs and exact occurrence arrays.
2. Equivalent lunar 2026-12-29 produces the **same** computed facts and retains KASI conversion source.
3. Published-minute Lichun 2027-02-04 10:46 produces *two separate* candidate projections and correct candidate-specific factRef namespaces.
4. At least one real 2027 February chart with `寅卯辰` complete raw seasonal member presence, rather than testing only fabricated 4-branch input.
5. Invalid/out-of-coverage dates, missing school policies, invalid provenance, frozen member-position/factRef snapshots.
6. All triad raw composition completeness, duplication and 20,736 branch-position source-oracle cases are upstream in `test/m2-triad-memberships.test.mjs`.

Classical textual reference and four-member 土局 exception: `docs/research/M2_TRIAD_MEMBERSHIP_SOURCE_GATE.md`.

## Remaining M2/V1 gate

This is structural facts only. Before any public screen, source prose needs Korean consumer comprehension/ambiguity review and a real browser test that explicitly explains why 'three members present' does **not** mean success/fortune. Source critical editions and M1 calendar release rights also remain open. No new consumer birth-year, data persistence, public deployment or PR merge is authorized.
