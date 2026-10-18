# KASI public lunar API alternative — actual endpoint / field review, NOT integrated

Review date: **2026-10-18**. Source: Korean public data portal entry ID 15012679, https://www.data.go.kr/data/15012679/openapi.do . The source was read directly; **no API service key was requested, no live authenticated call was made and no dataset was downloaded**.

## What the authoritative API listing actually guarantees

| Attribute | Observed listing | Implication |
| --- | --- | --- |
| Provider | 한국천문연구원 / 천문전산융합센터 | Different service from the official KASA 2027 월력요항 notice |
| Dataset | `한국천문연구원_음양력 정보` (ID 15012679) | Daily lunar/solar conversion, calendar day and sexagenary terms |
| Current documentation date | Registered 2016-01-06, last updated **2022-10-29** | Do not infer 2027 or 2026 revision/certification from registration date |
| Cost and permission listing | `무료`, `이용허락범위 제한 없음` | A promising **alternative for fields THIS API serves**; not an inferred relicensing of separate KASA works |
| Approval / quota | automatic development + production account approval; development 10,000 requests, operations expansion by usage-registration application | Requires key/account and accurate current traffic policy check before use |
| Wire format | REST / XML | Must validate XML response and official error codes (including key and rate errors); not a JSON endpoint by assumption |
| Gregorian→lunar method | `getLunCalInfo` | Has `solYear`, `solMonth`, optional `solDay`; **not** a minute-level Jie event API |
| Sample fields | `lunYear`, `lunMonth`, `lunDay`, `lunLeapmonth`, `lunNday`, `lunSecha`, `lunIljin`, `solJd`, `lunWolgeon` | Supports independent checks of current lunar conversion, leap month and day pillar, with explicit caution about Myeongli year/month rules |

Source's documented endpoint (no authentication key embedded):
```text
https://apis.data.go.kr/B090041/openapi/service/LrsrCldInfoService/getLunCalInfo
```

The public documentation enumerates **daily** Gregorian input parameters `solYear`, `solMonth`, `solDay`; it **does not establish** any 24-term *KST hour/minute* output. Public data from this service cannot be silently substituted for the separate minute-precision solar-term fixture. The example response includes `lunWolgeon` and `lunSecha`, whose official almanac meaning must NOT be automatically treated as the currently selected Myeongli month/year pillar, especially around 입춘/절입.

## Replacement architecture options

**Track A — verified API-backed lunar calendar data**: independent daily Korean lunar ↔ Gregorian reference for selected year spans. Obtain API key through owner's authenticated account, check usage terms/retention and correct errors. Normalize into internally defined `KoreanLunisolarProvenance` with new sourceId and edition. Side-by-side against `KASI_KOREAN_LUNISOLAR_2025_2027` for leap month starts, February boundary, end-year and day GanZhi; **do not automatically replace existing fixtures**.

**Track B — independently computed 24-term minute events**: source a separately licensed astronomical ephemeris or implement a documented astronomical method; compute sun apparent longitude targets in a defined time scale (TT/UTC/UT1 where applicable), convert to **Korean civil KST** and compare with independently published KASI/KASA values. Record exact rounding policy and second uncertainty. Failing a source parity threshold blocks product use. This is not a declaration that a simple solar-longitude calculation already meets the Korean published minute standard.

**Track C — direct official-content permission**: contact KASA/KASI for commercial caching and redistribution rights to the annual publication or specific finite fields. Preserve written scope and date, and avoid republishing restricted full tables without a lawful basis.

## Security, privacy and cost requirements

- Never embed the data.go.kr API service key in `web/index.html`, a published fixture, browser code, logs or GitHub; server-side secret manager where needed.
- Prefer one-time/build-time calendar verification or an audited finite source table rather than hitting a public API for **each user's birth query**. That reduces service dependency, external disclosure and rate-limit exposure.
- Verify exact date/format parsing; XML network timeout/retry limits; nonzero `resultCode`; malformed XML, duplicate daily entries and missing leap-month flags **fail closed**.
- Avoid service outage fallback to a *different* calendar source without sourceId/accuracy/profile changes being explicit in user-facing evidence.
- If storing normalized API output, review the actual "이용허락범위 제한 없음" wording, third-party terms, field/edition scope, attribution and redistribution before deciding policy. API metadata alone is not a signed legal permission for every operation.

## Concrete executable test oracle list (NOT RUN)

| ID | Input | Comparison |
| --- | --- | --- |
| `API-LUN-01` | 2027-02-05 and 2027-02-07 | Gregorian/lunar day and calendar transition |
| `API-LUN-02` | 2026-12-29 lunar equivalent | reverse parity with existing converter |
| `API-LUN-03` | all lunar leap-month transition dates in 2025–2027 | leap flag, count and adjacent-day monotonicity |
| `API-LUN-04` | selected `lunIljin` values against engine day-cycle | parity under **civil-day** reference only, do not equate with Zi rule |
| `API-LUN-05` | malformed XML, API 20/22/23 errors, HTTP timeout, quota | explicit blocked state with source evidence, no random fallback |
| `API-LUN-06` | ask whether endpoint responds with precise Jie minute | do not assume property or synthesize solar-term timestamps |

**Release decision:** daily lunar API is a *credible candidate*, NOT yet a validated runtime source or license for independently hosted 24 solar-term times. Keep commercial-calendar source gate OPEN until separate evidence is acquired.
