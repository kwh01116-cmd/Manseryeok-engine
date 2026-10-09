# V0 Korean birth chart preview

Entry point: `resolveKoreanBirthChartPreview`. Inputs: explicit Gregorian or Korean lunar date, HH:MM, time policies, lunar converter, solar-term events and coverage manifest.

Output: ko-KR year/month/day/hour Hanja and Hangul, candidate alternatives, confidence, coverage and source metadata. Gregorian and lunar inputs converge on the same chart when their civil dates match.

Scope: presentation-only composition of existing M1 rules. No school interpretation. Source precision and official-edition verification remain open.

Checks: isolated strict TypeScript compilation and six focused tests passed with stubbed collaborators. Full repository check not executed because shell GitHub DNS is unavailable. Do not merge until checked.
