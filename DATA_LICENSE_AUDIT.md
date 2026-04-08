# Data Source License Audit (Commercial Use)

This note tracks data-source usage in the current codebase and flags commercial-use risk.
It is an engineering checklist, not legal advice.

## Runtime sources (currently fetched in production code)

From `server.ts` (`fetchDataFeeds`), these are actively called:

| Source label in app | Endpoint used in code | Current use | Commercial-use status | Action |
|---|---|---|---|---|
| USGS Earthquake API | `https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson` | Pull latest quake events, summarize in AI context/UI | Unknown (needs legal confirmation) | Review USGS terms + attribution requirements; keep source URL in UI |
| CISA KEV (API) | `https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json` | Pull top vulnerabilities, summarize in AI context/UI | Unknown (needs legal confirmation) | Verify CISA reuse policy for commercial products; document attribution |
| GDACS (UN/EU) RSS | `https://www.gdacs.org/xml/rss.xml` | Pull disaster alert titles, summarize in AI context/UI | Unknown (needs legal confirmation) | Review GDACS/UN/EU terms for redistribution/commercial use |
| Open-Meteo Forecast | `https://api.open-meteo.com/v1/forecast?...` | Weather/rain probability | Unknown (needs legal confirmation) | Verify API terms, rate and attribution rules |
| Open-Meteo Air Quality | `https://air-quality-api.open-meteo.com/v1/air-quality?...` | PM2.5 | Unknown (needs legal confirmation) | Verify API terms, rate and attribution rules |
| FRED API (STLFSI4) | `https://api.stlouisfed.org/fred/series/observations?...` | Pull latest financial stress baseline, summarize in AI context/UI | Unknown (needs legal confirmation) | Verify FRED attribution + redistribution/commercial policy |

## Listed but not fetched yet (lower immediate runtime risk)

These appear in whitelist/table/backlog but are not currently called in `fetchDataFeeds`:

- MITRE ATT&CK
- ThaiCERT
- NCSA
- OFR Financial Stress
- IMF GFSR + WEO
- NASA FIRMS
- DDPM / T-Alert
- NDWC
- PTWC
- Copernicus C3S
- CEMS Early Warning
- NOAA Global Monitoring
- NASA GISS
- DDC
- OECD AIM

Before wiring any of the above, confirm:

1. Commercial-use permission
2. Attribution text/link requirements
3. Caching/redistribution restrictions
4. API rate limits and automated access rules

## Recommended policy gate (engineering)

Before enabling any new source in production:

- Add entry to this file with status: `allowed` / `restricted` / `unknown`
- Add official terms URL and required attribution
- Require review sign-off (`Legal` or delegated owner)
- If status is `unknown`, block source from production rollout

## Suggested next implementation guard

Add env-based allowlist for runtime fetch (example):

- `ALLOWED_RUNTIME_SOURCES=USGS,CISA,GDACS,OPEN_METEO`

Then skip any source not explicitly allowed in deployment config.

## Candidate sources under review (not approved yet)

Status legend used below:

- `pending-legal` = candidate looks useful but cannot be used in production yet
- `allowed` = legal/commercial check passed
- `restricted` = cannot be used as planned (or needs paid/explicit license)

### Geopolitics

| Candidate | URL | Status | Notes |
|---|---|---|---|
| UCDP | `https://ucdp.uu.se/` | `pending-legal` | Strong conflict/event relevance; verify commercial reuse + attribution terms |
| Matteo Iacoviello GPR | `https://www.matteoiacoviello.com/` | `pending-legal` | Good macro geopolitical index; verify redistribution/commercial terms |
| ReliefWeb API (OCHA/UN) | ReliefWeb API | `pending-legal` | Strong humanitarian/conflict signal; verify attribution and commercial-use conditions |
| UCDP API | UCDP API endpoints | `pending-legal` | Treat separately from portal page; check API terms/rate/redistribution rules |
| GPR Index (Caldara & Iacoviello / Fed context) | GPR data/publication endpoints | `pending-legal` | Good macro indicator; confirm rights for commercial product integration |
| ICEWS Event Data (Harvard Dataverse) **[excluded]** | Harvard Dataverse distribution | `pending-legal` | Dataset access may include citation/usage constraints; verify before production use |
| World Monitor (MIT License) **[excluded]** | World Monitor repository/feed | `pending-legal` | MIT code license may not cover all data inputs; verify upstream data rights |

### Bio-Security

| Candidate | URL/Program | Status | Notes |
|---|---|---|---|
| DDC Open API (Thailand) | (official DDC open endpoint) | `pending-legal` | Priority local source; verify API terms and attribution wording |
| WOAH WAHIS | WOAH animal health information system | `pending-legal` | Good structured outbreak data; confirm reuse/commercial permissions |
| FAO EMPRES-i | FAO EMPRES-i | `pending-legal` | High relevance for transboundary animal disease signals |
| HealthMap (Free API) **[excluded]** | HealthMap | `pending-legal` | Verify free-tier commercial limitations and automation terms |
| WHO EWARS | WHO EWARS | `pending-legal` | Verify productization/commercial use constraints |
| CDC Global Health Thailand | CDC program pages/data | `pending-legal` | Confirm machine-readable feed terms |
| OpenPMC / PubMed surveillance | NCBI/PMC search-based ingest | `pending-legal` | Usually feasible with attribution; verify rate/automation policy |
| EPIWATCH (Research Access) **[excluded]** | EPIWATCH | `pending-legal` | Research-oriented access; commercial use may require explicit approval |

### AI

| Candidate | URL/Program | Status | Notes |
|---|---|---|---|
| OWASP AI Exchange | OWASP AI Exchange | `pending-legal` | Security best-practice + intel context; check content licensing details |
| Huntr / AI CVEs | Huntr ecosystem | `pending-legal` | Useful vuln stream; verify API/redistribution terms |
| AI Incident Database | AI incident repository | `pending-legal` | High-value incident chronology; verify reuse policy |
| MITRE ATLAS | MITRE ATLAS | `pending-legal` | Strong ATT&CK-style AI threat mapping; confirm terms |
| PointGuard AI Tracker | PointGuard tracker | `pending-legal` | Verify source provenance, continuity, and commercial rights |

### Finance / Economy

| Candidate | URL/Program | Status | Notes |
|---|---|---|---|
| FRED API | Federal Reserve Economic Data API | `pending-legal` | Priority macro baseline; verify attribution and redistribution terms |
| US SEC EDGAR RSS | SEC filings feed | `pending-legal` | Strong market disclosure signal; verify automated polling constraints |
| BIS Statistics API | BIS statistics endpoints | `pending-legal` | Useful cross-country macro/financial data; confirm commercial reuse |
| OFR Financial Stress Index | OFR FSI data | `pending-legal` | Core stress metric candidate; validate data terms and update cadence |
| FRED STLFSI4 | St. Louis Fed stress index series | `pending-legal` | Candidate derived from FRED; reuse constraints likely tied to FRED terms |
| OFR FSI Python wrapper (`ofrapi`) | Wrapper/library layer | `pending-legal` | Library license may allow use, but underlying data terms still govern |
| BOT (Bank of Thailand) API | ธปท. data APIs | `pending-legal` | High local relevance; verify official API terms and attribution text |
| OFR FSI + STFM + HFM + BSRM stack | Composite internal stack | `pending-legal` | Methodology is open/implementable, but input datasets require separate checks |
| FRED + NY Fed Nowcast + Cleveland Recession stack | Composite internal stack | `pending-legal` | Verify each upstream source terms independently before production use |
| CEWI + XGBoost implementation (open-source) | Model/framework approach | `pending-legal` | Code may be open-source, but training/inference data rights must be cleared |

### Social Risk (Thailand-focused)

| Candidate | URL/Program | Status | Notes |
|---|---|---|---|
| Traffy Fondue (Open Data) | Traffy Fondue platform/open data | `pending-legal` | High local civic signal; verify API/data redistribution terms |
| ThaiCERT RSS/API | ThaiCERT feeds | `pending-legal` | Security/social incident overlap; confirm automation and commercial policy |
| Open Data Thailand (DGA) | DGA open data catalogs | `pending-legal` | Check per-dataset license (not all datasets share same terms) |
| data.go.th (DGA) | National open data portal | `pending-legal` | Must verify license per dataset + attribution obligations |
| NSO data via data.go.th | National Statistical Office datasets | `pending-legal` | Verify dataset-level terms, update interval, and reuse conditions |
| GISTDA Disaster Platform | GISTDA disaster portal | `pending-legal` | Good hazard/social impact context; verify API/public-use terms |
| GISTDA Open Data JSON API | GISTDA machine-readable endpoints | `pending-legal` | Confirm endpoint terms + rate limits |
| ReliefWeb API | ReliefWeb | `pending-legal` | Strong humanitarian/event stream; check attribution and rate policy |
| UNOSAT Flood Portal Thailand | UNOSAT flood products | `pending-legal` | Useful flood impact signal; verify reuse/commercial constraints |
| IFRC go.ifrc.org | IFRC emergency data | `pending-legal` | Verify terms for commercial integration and republishing |
| DPM Portal (กรมป้องกันฯ) | DDPM/DPM public portal | `pending-legal` | Confirm machine access and redistribution permission |
| TDRI Open Reports | TDRI publications | `pending-legal` | Often document-based; verify reuse in automated products |
| PyThaiNLP + GDELT stack | NLP + event aggregation stack | `pending-legal` | Code may be open-source, but upstream GDELT/inputs still need policy checks |
| GISTDA + DDPM + UNOSAT stack | Composite disaster/social stack | `pending-legal` | Each upstream source must be cleared separately before production use |

## Minimum legal checklist per candidate

Before moving a candidate to `allowed`, capture:

1. Official terms/license URL
2. Explicit commercial-use permission (yes/no/conditional)
3. Required attribution text and link
4. Automation/scraping/API access policy
5. Rate limits and caching/redistribution constraints

## Recommended implementation shortlist (engineering-first)

These are recommended next-to-wire candidates based on relevance + likely operational fit.
All remain `pending-legal` until explicitly cleared.

### 1) Geopolitics (priority order)

1. ReliefWeb API (OCHA/UN)
2. UCDP API
3. GPR Index (Caldara & Iacoviello)
4. (reserved for next approved source)

### 2) Bio-Security (priority order)

1. DDC Open API (Thailand)
2. WOAH WAHIS
3. FAO EMPRES-i
4. PubMed/OpenPMC surveillance queries

### 3) AI (priority order)

1. MITRE ATLAS
2. AI Incident Database
3. OWASP AI Exchange
4. Huntr / AI CVEs

### 4) Finance / Economy (priority order)

1. FRED API
2. BOT (Bank of Thailand) API
3. OFR Financial Stress Index
4. BIS Statistics API

### 5) Social Risk (Thailand-focused, priority order)

1. data.go.th (DGA) datasets with explicit open license
2. Traffy Fondue (Open Data)
3. GISTDA Open Data JSON API
4. ReliefWeb API (cross-domain humanitarian events)

## Suggested rollout batches

- Batch A (fastest practical): ReliefWeb, FRED, DDC, MITRE ATLAS, data.go.th
- Batch B (next): UCDP API, WOAH WAHIS, AI Incident DB, BOT API, Traffy Fondue
- Batch C (advanced): EMPRES-i, OFR/BIS composites, GISTDA + DDPM + UNOSAT stacks

## Provisional exclude list (high legal risk / unclear rights)

Conservative recommendation: keep these out of production until explicit written approval.

| Candidate | Provisional decision | Reason (current evidence) | Next step |
|---|---|---|---|
| ICEWS Event Data (Harvard Dataverse) | `exclude-for-now` | Terms indicate research/education only and no commercial copying/use | Remove from implementation queue unless licensed exception is obtained |
| HealthMap (Free API) | `exclude-for-now` | Public terms indicate non-commercial usage context; API commercial rights unclear | Use alternative sources unless formal commercial terms are granted |
| EPIWATCH (Research Access) | `exclude-for-now` | Access model appears research-oriented; commercial terms not clearly published | Contact provider for explicit commercial permission before use |
| World Monitor (MIT License) | `exclude-for-now` | Code license may be permissive, but upstream data rights are not guaranteed by MIT alone | Verify every underlying feed's rights before re-adding |

If any of the above are later approved, update status from `exclude-for-now` to `pending-legal`/`allowed` with legal evidence URL and sign-off.

## 8-domain coverage matrix (current target state)

This matrix is the operational tracker to make coverage explicit across all eight client domains.

| Domain | Current runtime coverage | Approved source(s) in production | Next source(s) to clear and wire | Status |
|---|---|---|---|---|
| `nature` | Yes | USGS Earthquake API | GDACS quality hardening / optional secondary quake feed | `active` |
| `climate` | Yes | Open-Meteo (forecast + air quality) | Additional climate alerts (if licensed) | `active` |
| `cyber` | Yes | CISA KEV API | MITRE ATT&CK / ThaiCERT / NCSA (after legal/API checks) | `active+expand` |
| `geopolitics` | Partial | (AI inference on current context) | ReliefWeb API, UCDP API, GPR Index | `pending-source` |
| `bio` | Partial | (AI inference on current context) | DDC Open API, WOAH WAHIS, FAO EMPRES-i | `pending-source` |
| `ai` | Partial | Gemini analysis layer | MITRE ATLAS, AI Incident DB, OWASP AI Exchange | `pending-source` |
| `finance` | Partial | (AI inference on current context) | FRED API, BOT API, OFR FSI, BIS Stats | `pending-source` |
| `social` | Partial | (AI inference on current context) | data.go.th, Traffy Fondue, GISTDA Open Data | `pending-source` |

### Completion definition (what "ครบ 8" means)

For each of 8 domains:

1. At least one legally-cleared external source is marked `allowed`
2. Ingest is wired in code and observable in runtime status
3. Source attribution is shown in output (`sourceName` / `sourceUrl`)
4. Fallback placeholder remains available if source is temporarily down
