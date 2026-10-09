# V0 CLI adapter

Draft feature: command-line input adapter for the existing finite Korean calendar preview. Inputs require explicit calendar type, date, HH:MM, time basis, day rollover, and hour-stem reference; lunar input additionally requires leap flag.

Checks executed: Node 22 syntax checks PASS on four candidate files; five standalone argument-parser tests PASS. Full repository npm check and integrated engine tests NOT RUN due network restrictions. No merge.

Usage: node scripts/chart-preview-cli.mjs --help

Scope: 2026-2027 published-minute fixture, structural coverage only; source edition and policy disputes remain open. Next: canonical checkout and tests, then official source comparison.
