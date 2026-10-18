# Rule registry schema v0

The registry bridges research evidence and executable behavior. A rule must not become executable merely because it appears in a modern table or another library.

## Required model

Codeability: EXACT | CONDITIONAL | INTERPRETIVE

Dispute status: STABLE | SCHOOL_DEPENDENT | SOURCE_CONFLICT | UNVERIFIED

Evidence layer: OFFICIAL_KOREAN_CALENDAR | ASTRONOMICAL_FACT | CLASSICAL_BASE_TEXT | CLASSICAL_COMMENTARY | LATER_COMMENTARY | KOREAN_PRACTICE | MODERN_HEURISTIC | OPEN_SOURCE_IMPLEMENTATION

Each RuleRecord must carry: ruleId, domain, title, evidenceLayer, sourceIds, preconditions, effect, exceptions, boundaryConditions, codeability, disputeStatus, optional policyId, testVectorIds, adversarialCounterexampleIds, and version.

## Promotion gate

A rule can enter the policy-free deterministic core only when:

1. semantics are stable enough to state without interpretive judgement;
2. provenance is recorded;
3. boundary conditions are explicit;
4. at least one positive and one relevant boundary/adversarial test exist;
5. no unresolved source conflict changes the executable result.

School-dependent rules require a versioned policy ID. Unverified rules remain research/documentation only.

## Confidence separation

Do not collapse source age, textual stability, semantic confidence and implementation confidence into one score.
