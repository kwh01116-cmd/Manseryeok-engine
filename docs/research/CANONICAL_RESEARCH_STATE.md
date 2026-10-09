# Canonical research state

This repository is now the canonical home for the Korea-first Manseryeok / Myeongli project. Earlier chat-era research should be migrated here incrementally, preserving provenance rather than being copied as undifferentiated notes.

## Confirmed architectural decisions

- Separate astronomical/civil-time facts from Myeongli interpretation.
- Korean official calendar/time sources have priority for Korea-facing behavior: KASA/official gazette first where applicable, KASI almanac/computational material next, then independent astronomical cross-checks.
- Historical Korean civil time and DST must be reconstructed before pillar calculations; current UTC+9 must never be retroactively assumed for all Korean births.
- Time representation and Myeongli time policy are distinct. Civil time, local mean solar time, and local apparent solar time must not be collapsed into a single “true solar time” boolean.
- Zi-hour day rollover is policy-dependent. Day-pillar rollover, hour-branch start, and late-Zi hour-stem reference must be independently representable.
- Month boundaries and Da-yun boundary calculations use solar-term events, but the exact traditional policy must be carried explicitly rather than inferred from a modern library.
- Element distribution is not day-master strength.
- Twelve-growth-stage lookup is deterministic; converting it into a strength score is not a classical deterministic fact.
- Pattern analysis from Zi Ping Zhen Quan requires ordered/topological interaction and pattern-state transitions, not only ten-god presence.
- “Useful god” is not a single universal field: structural, balancing, climate, medicine/illness, bridging, and follow/transform traditions must remain distinguishable.
- Follow and transformation structures are structural classifiers, not simple strength-score thresholds.
- Shen-sha is supplementary and must not silently override the core structural analysis.
- Classical base text, original commentary, later commentary, Korean practice, and modern heuristic rules require separate provenance.
- Textual confidence is distinct from implementation confidence; lacuna restoration and critical emendation must remain visible.

## Implementation policy

Only deterministic rules with stable semantics enter the executable core without a policy object. Disputed or school-dependent rules require a versioned policy and rule-registry provenance before execution.

The first coded slice intentionally covers only:

- heavenly stems
- earthly branches
- five elements and yin/yang
- sexagenary cycle
- stem-to-stem ten-god relation

Critical-path correction: historical Korean time remains isolated infrastructure but is not an M1 blocker. Future slices prioritize official KASA/KASI solar-term and lunisolar golden fixtures, then a complete modern-Korea Four-Pillars pipeline and deterministic ChartFacts. Historical DST/pre-1908 work returns after that vertical slice unless a required fixture depends on it. See `docs/ROADMAP.md`.
