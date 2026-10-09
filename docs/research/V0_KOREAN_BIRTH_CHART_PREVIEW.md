# V0 Korean birth chart preview

Entry point: `resolveKoreanBirthChartPreview`. Inputs: explicit Gregorian or Korean lunar date, HH:MM, time policies, lunar converter, solar-term events and coverage manifest.

Output: ko-KR year/month/day/hour Hanja and Hangul, candidate alternatives, confidence, coverage and source metadata. Gregorian and lunar inputs converge on the same chart when their civil dates match.

Scope: presentation-only composition of existing M1 rules. No school interpretation. Source precision and official-edition verification remain open.

Checks: isolated strict TypeScript compilation and six focused tests passed with stubbed collaborators. Full repository check not executed because shell GitHub DNS is unavailable. Do not merge until checked.

## Sexagenary-label integrity (2026-10-09; draft)

The previous Korean label adapter accepted impossible combinations such as 甲丑 or 乙子 when both glyphs were individually valid. It now uses the existing 60-cycle `ganZhiIndex` and rejects any non-cycle pair with `RangeError`. This is an EXACT deterministic domain invariant, not a Myeongli-school policy or astronomical claim. Preconditions: one stem and one branch; boundary: all 60 canonical pairs valid, all 60 parity-invalid pairs rejected; counterexample: 甲丑. No defaults changed.

Checks: Node 22.16.0 isolated reconstructed-logic tests 3/3 PASS (60 valid pairs, 60 impossible pairs, malformed glyph). Exact repository `npm ci && npm run check` NOT RUN because GitHub DNS fails; repository assertions remain UNVERIFIED. No official KASA data were changed.
