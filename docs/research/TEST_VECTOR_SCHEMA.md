# Test-vector schema v0

A golden fixture is evidence, not merely an expected value copied from another implementation.

Each TestVector carries: vectorId, domain, purpose (UNIT | BOUNDARY | GOLDEN | DIFFERENTIAL | ADVERSARIAL | REGRESSION), input, expected, sourceIds, policyIds, source precision/tolerance where relevant, and notes.

## Official-calendar fixture rules

For KASA/KASI-derived fixtures record, at minimum:

- publication/edition year;
- source authority and stable source page identifier;
- displayed time basis (for example KST) when the source states it;
- source precision (day/minute/etc.);
- retrieval date;
- checksum only when a local source snapshot is legally retained;
- transcription method and reviewer status.

Do not manufacture second-level precision from a minute-level publication. A boundary test derived from a minute-level official value must preserve that limitation rather than pretending the official source proves an exact second.

## Differential fixtures

An open-source implementation is never the authority by majority vote. Pin repository, commit/tag, configuration/policy and input. A disagreement is a diagnostic until resolved against stronger evidence.
