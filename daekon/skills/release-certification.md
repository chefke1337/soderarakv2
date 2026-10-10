# Skill: release-certification (daekon-release-certifier)

Cél: végső, független döntés — csak a kapu- és team-kimenetekből, vélemény nélkül.

## Döntési tábla
| blocker kapuk | advisory kapuk | Verdict |
|---|---|---|
| mind PASS | bármilyen | **PASS** |
| ≥1 FAIL | bármilyen | **FAIL** |
| ≥1 NOT_VERIFIED / nem futott | bármilyen | **NOT_VERIFIED** |

## Eljárás
1. Futtasd: `npm run daekon` (kapuk + team executors).
   **Csak a teljes lánc igazol release-t.** A `npm run daekon:fast` (build + og + qa,
   külön riportban: `daekon-report-fast.md`) iterációs eszköz — annak PASS-ja
   NEM jogosít deploy-ra, a `daekon-report.md`-t nem is írja felül.
2. Ellenőrizd, hogy a riport minden blocker kapunál valódi kimenetet mutat — üres/hiányzó kimenet = NOT_VERIFIED.
3. A team-szekció (SEO-audit, hibaminták, kompetitor-állapot) informáló: a verdict a kapukból dől.
4. PASS után deploy csak a [deploy-checklist](../daekon/deploy-checklist.md) szerint.

## Naplózás
Minden futás → `daekon/LOG.md`. Ez a csapat memóriája, amiből minden szerep tanul.
