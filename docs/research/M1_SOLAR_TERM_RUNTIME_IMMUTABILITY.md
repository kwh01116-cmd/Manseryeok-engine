# M1 runtime immutability of Korean solar-term fixture

Date: 2026-10-09 KST. Status: DRAFT, canonical checks pending.

Finding: The TypeScript readonly annotation does not freeze JavaScript values. The shared 49-event KASI-derived fixture was mutable, including nested source identifiers. In-place changes could affect later chart results.

Change: Freeze the outer event list, each event and its sourceIds array. The 2025 DAXUE guard is included. No calendar value or calculation policy changed.

Provenance: KR-KASI-CALENDAR-DATA; codeability EXACT for runtime immutability, no school dispute. Preconditions: consumers use the built-in fixture. Adversarial tests: mutation of array, event minute and source ID must throw in strict ESM; cloned objects remain editable for test vectors.

Limits: This is not proof of the transcribed minutes, an official KASA comparison or a pinned data digest. Node 22 isolated runtime check PASS; exact checkout and npm run check NOT RUN because github.com was inaccessible. Keep PR draft.
