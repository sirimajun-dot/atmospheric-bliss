# Cloud Run Launch Plan (Security + Compliance Baseline)

This document prepares `Atmospheric Bliss` for production on Google Cloud Run with a CIS-style Level 1 baseline.

## Master plan & where to track progress

**Single source of truth (SSOT):** this file — `CLOUDRUN_DEPLOY.md` at the **repository root** (same directory as `package.json` in your clone).  
**How to use it:** after each phase, tick the roll-up boxes below and any bullets in §4.1 so the next person (or session) knows **where you left off**.

| Phase | Section | What it covers |
|-------|---------|----------------|
| **A** | §1–2, §2.1 | GCP project, APIs, Secret Manager, IAM, Artifact Registry, Cloud Build SA |
| **B** | §3–3.1 | Cloud Build deploy, Firestore + `datastore.user` |
| **C** | §4 | Automated smoke (`curl` / JSON) on the live service URL |
| **D** | §4.1 | Browser UAT: all surfaces, ingestion signals, alerts, deep dive, UX/UI, radar |
| **E** | §5 | CIS-style operational baseline (audit, least privilege, patching) |
| **F** | §6 | Legal / policy / incident readiness |
| **G** | §7 | Scale tuning, ads/consent (optional backlog) |
| **H** | §4.2 | Post-UAT: normalize 8 domains, findings scores, heuristics, dashboard UX (P1–P4) |

### Roll-up status (edit checkboxes as you complete each phase)

- [ ] **A** — Prerequisites & secrets + §2.1 (§1–2, §2.1) — *your GCP project*
- [ ] **B** — Deploy + Firestore (§3–3.1) — *successful `gcloud builds submit` + DB*
- [ ] **C** — Post-deploy smoke (§4) — *curl checks on Cloud Run URL*
- [ ] **D** — Browser / product UAT (§4.1) — *run only after §4 passes*
- [ ] **E** — CIS operational baseline (§5) — *console / process*
- [ ] **F** — Legal & policy (§6) — *org documentation*
- [ ] **G** — Scale & ads readiness (§7) — *when needed*
- [ ] **H** — §4.2 backlog (P1→P4) — *after Phase D unless reprioritized*

### Repository implementation (already in codebase; does not replace §A–C on GCP)

Tick only if your deployed revision actually includes these commits.

- [x] Cloud Run container: default listen port via `Dockerfile` (`ENV PORT=8080`)
- [x] `cloudbuild.yaml`: `--max-instances` from substitution `_MAX_INSTANCES` (default `1`); raising it can duplicate the background intelligence loop — override only deliberately (`--substitutions=_MAX_INSTANCES=N`)
- [x] Optional Google Sign-In: `AUTH_MODE=google`, `GOOGLE_OAUTH_CLIENT_ID`, `/api/auth/*`, httpOnly cookie + Bearer for `/api/*` (except auth & health)
- [x] Server: Gemini text/JSON handling, deep-dive rate limit, tactical pulse env (`TACTICAL_PULSE_MS`, `DISABLE_TACTICAL_PULSE`), feed `unavailable` status
- [x] Client: `credentials: 'include'` on `/api/state` and deep-dive; `GoogleAuthGate`; API status table + deep-dive error display

*After a major merge, re-open this list and adjust if behavior changed.*

### Execution order (do this now on GCP)

1. **Phase A** — Complete §1–2 (`gcloud config`, enable APIs, `GEMINI_API_KEY` secret + IAM), then **§2.1** (Artifact Registry repo + Cloud Build IAM).
2. **Phase B** — §3 `gcloud builds submit --config cloudbuild.yaml` from the repo root, then §3.1 Firestore + `datastore.user`.
3. **Phase C** — §4 smoke on `SERVICE_URL` (bash `curl` or PowerShell below).
4. **Phase D** — §4.1 browser UAT; tick roll-up **D** when done.
5. **After D** — §4.2 product/intelligence backlog (P1→P4); optional GitHub issues tagged `BACKLOG-P1` … `BACKLOG-P4`.

---

## 1) Prerequisites

- Google Cloud project with billing enabled
- `gcloud` CLI installed and authenticated
- Required APIs enabled:
  - Cloud Run API
  - Cloud Build API
  - Secret Manager API
  - Artifact Registry API
  - Firestore API (for §3.1 persistence)

## 2) One-time project setup

```bash
gcloud config set project YOUR_PROJECT_ID
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com \
  artifactregistry.googleapis.com \
  firestore.googleapis.com
```

Store Gemini key in Secret Manager:

```bash
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets create GEMINI_API_KEY --data-file=- || true
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-
```

Grant Cloud Run runtime service account access to secret:

```bash
PROJECT_NUMBER=$(gcloud projects describe YOUR_PROJECT_ID --format='value(projectNumber)')
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### 2.0a) Google Sign-In — OAuth Web Client ID (required for current `cloudbuild.yaml`)

The default **`cloudbuild.yaml`** deploys with **`AUTH_MODE=google`** and mounts the **Web** OAuth client ID from Secret Manager as **`GOOGLE_OAUTH_CLIENT_ID`** (same variable the server reads). Create the OAuth client and secret **before** the next `gcloud builds submit`, or the deploy step will fail when wiring secrets.

1. **Google Cloud Console** → **APIs & Services** → **Credentials** → **Create credentials** → **OAuth client ID** → type **Web application**.  
2. **Authorized JavaScript origins:** add your Cloud Run URL, e.g. `https://atmospheric-bliss-XXXXX.asia-southeast1.run.app` (no path; use your real hostname from `gcloud run services describe`).  
3. **Authorized redirect URIs:** usually not required for GIS One Tap / button on the same origin; add only if your flow uses redirects.

Store **only** the client id string (ends with `.apps.googleusercontent.com`), not the client secret, in Secret Manager:

```bash
PROJECT_ID=$(gcloud config get-value project)
PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')
RUNTIME_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
CB_SA="${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"

echo -n "YOUR_CLIENT_ID.apps.googleusercontent.com" | gcloud secrets create GOOGLE_OAUTH_CLIENT_ID --data-file=- 2>/dev/null || \
  echo -n "YOUR_CLIENT_ID.apps.googleusercontent.com" | gcloud secrets versions add GOOGLE_OAUTH_CLIENT_ID --data-file=-

for MEM in "serviceAccount:${RUNTIME_SA}" "serviceAccount:${CB_SA}"; do
  gcloud secrets add-iam-policy-binding GOOGLE_OAUTH_CLIENT_ID \
    --member="$MEM" --role="roles/secretmanager.secretAccessor" --quiet 2>/dev/null || true
done
```

Grant **Cloud Build** access so the deploy step can attach the secret to Cloud Run (if not already project-wide). The loop above adds both runtime and Cloud Build SAs. If a binding already exists, errors are ignored.

**Public mode again:** change `cloudbuild.yaml` to remove `AUTH_MODE=google` and `GOOGLE_OAUTH_CLIENT_ID=...` from `--set-env-vars` / `--set-secrets`, then redeploy.

### 2.1) Artifact Registry + Cloud Build IAM (before first `gcloud builds submit`)

`cloudbuild.yaml` pushes to **`asia-southeast1-docker.pkg.dev/$PROJECT_ID/app-images/...`** — create the Docker repo once (skip if it already exists):

```bash
gcloud artifacts repositories describe app-images --location=asia-southeast1 2>/dev/null || \
  gcloud artifacts repositories create app-images \
    --repository-format=docker \
    --location=asia-southeast1 \
    --description="Atmospheric Bliss images"
```

Grant the **Cloud Build default service account** permission to deploy Cloud Run and push images (replace `YOUR_PROJECT_ID` if not already the active config):

```bash
PROJECT_NUMBER=$(gcloud projects describe YOUR_PROJECT_ID --format='value(projectNumber)')
CB_SA="${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"
for ROLE in roles/run.admin roles/iam.serviceAccountUser roles/artifactregistry.writer; do
  gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="serviceAccount:${CB_SA}" \
    --role="${ROLE}"
done
```

If deploy still fails on **secret** wiring, confirm the **runtime** account `${PROJECT_NUMBER}-compute@developer.gserviceaccount.com` has `roles/secretmanager.secretAccessor` on **`GEMINI_API_KEY`** and **`GOOGLE_OAUTH_CLIENT_ID`** (see §2.0a). Cloud Build’s default SA may also need **secretAccessor** on those secrets to complete `gcloud run deploy`.

## 3) Deploy via Cloud Build

```bash
gcloud builds submit --config cloudbuild.yaml
```

The current `cloudbuild.yaml` deploys with:

- Gen2 execution environment
- Autoscaling: `min=0`, `max` = Cloud Build substitution **`_MAX_INSTANCES`** (default **`1`** in the repo — one Node process avoids duplicate Gemini/Firestore background work). Override at submit time, e.g. `--substitutions=_MAX_INSTANCES=3`
- Bounded resources (`1 vCPU`, `512Mi`, `timeout 60s`) — confirm in `cloudbuild.yaml` if you change them
- **`AUTH_MODE=google`** with secrets **`GEMINI_API_KEY`** and **`GOOGLE_OAUTH_CLIENT_ID`** from Secret Manager (see §2.0a)
- Firestore-backed state persistence (`ENABLE_FIRESTORE_PERSISTENCE=true`)

## 3.1) Firestore setup (restart-safe state)

Create Firestore (Native mode) once per project:

```bash
gcloud firestore databases create --location=asia-southeast1 --type=firestore-native
```

Grant runtime service account access:

```bash
PROJECT_NUMBER=$(gcloud projects describe YOUR_PROJECT_ID --format='value(projectNumber)')
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/datastore.user"
```

## 4) Post-deploy smoke checks

```bash
SERVICE_URL=$(gcloud run services describe atmospheric-bliss --region asia-southeast1 --format='value(status.url)')
curl -sS "$SERVICE_URL/healthz"
curl -sS "$SERVICE_URL/readyz"
curl -sS -o /dev/null -w "%{http_code}\n" "$SERVICE_URL/api/state"
```

- **`/healthz`** and **`/readyz`** should return JSON even when the app uses Google Sign-In.
- **`/api/state`:** with **`AUTH_MODE=public`** (default), expect **200** and JSON. With **`AUTH_MODE=google`**, an unauthenticated `curl` (no cookie / no `Authorization: Bearer`) correctly returns **401** JSON — treat **`/healthz` + `/readyz` + 401 on `/api/state`** as smoke OK, then confirm state in the browser after login (§4.1).

**Gate:** do not start §4.1 until §4 passes: health endpoints OK, and `/api/state` is either JSON **200** (public) or JSON **401** with `authRequired` (google) — never an HTML error page.

### 4.0) Same checks in PowerShell (Windows)

From a shell where `gcloud` works:

```powershell
$SERVICE_URL = gcloud run services describe atmospheric-bliss --region asia-southeast1 --format="value(status.url)"
Invoke-RestMethod -Uri "$SERVICE_URL/healthz"
Invoke-RestMethod -Uri "$SERVICE_URL/readyz"
curl.exe -sS -o NUL -w "%{http_code}`n" "$SERVICE_URL/api/state"
```

The last line prints **200** (public) or **401** (google mode without session). `healthz` / `readyz` should still return JSON.

**One-shot script (template):** from repo root, after `gcloud` is logged in and project is set:

```powershell
powershell -ExecutionPolicy Bypass -File "scripts\cloud-run-smoke.ps1.example" -ProjectId "YOUR_PROJECT_ID"
```

Or `-ServiceUrl "https://....run.app"` to skip `gcloud run services describe`.

### 4.0.1) Optional: public / internal ingress toggles (Windows)

Repo includes **templates only** (no real project id):

- `scripts/morning-on.ps1.example` — `ingress=all` + `allUsers` invoker (public again).
- `scripts/night-off.ps1.example` — remove public invoker + `ingress=internal`.

Copy to local names (gitignored) or pass project explicitly:

```powershell
Copy-Item "scripts\morning-on.ps1.example" "scripts\morning-on.ps1"
# Edit ProjectId inside the copy, or run:
powershell -ExecutionPolicy Bypass -File "scripts\morning-on.ps1.example" -ProjectId "YOUR_PROJECT_ID"
```

## 4.1) Post-deploy browser / product UAT (after §4)

Run against the **same** `SERVICE_URL` in a normal browser (desktop + at least one mobile width). Check items and tick when verified.

**Reference IDs** (use in issues/PRs: e.g. “UAT-4.1-radar”):

| ID | Area |
|----|------|
| UAT-4.1-nav | All pages / routes / modals reachable without console errors |
| UAT-4.1-ingest | Data ingestion signals (live vs stale): API status table, connection/system status, `lastUpdated` behavior |
| UAT-4.1-display | Main dashboard: risk cards, logs, bilingual strings render (no raw `{ }` objects) |
| UAT-4.1-alerts | Threat / alert surfaces: severity, copy, empty states |
| UAT-4.1-deep | Threat deep dive: expand log → request completes or shows clear error (401/429/502); works with Google auth if enabled |
| UAT-4.1-ux | UX/UI: typography, spacing, scroll, glass panels, breakpoints (narrow / wide) |
| UAT-4.1-radar | Radar chart: renders, labels legible, no clipping, sensible with few/many categories |

Checklist:

- [ ] **UAT-4.1-nav** — Open every primary view (including settings/legal/disclaimer flows if shipped); no blank screen; no repeated redirect loops
- [ ] **UAT-4.1-ingest** — Confirm feeds/API rows show expected status; tooltips or labels make sense when a source is `unavailable`
- [ ] **UAT-4.1-display** — Risk summaries and logs update after refresh; no broken charts/tables
- [ ] **UAT-4.1-alerts** — Alert UI matches severity; dismiss or filter if applicable works
- [ ] **UAT-4.1-deep** — Deep dive: success path shows structured briefing; failure shows user-visible message (rate limit / AI error / network)
- [ ] **UAT-4.1-ux** — Resize window / mobile emulation; tap targets; readable font sizes
- [ ] **UAT-4.1-radar** — Radar axes and series visible; legend readable; dark/light contrast acceptable

When all §4.1 boxes are checked, mark **Phase D** complete in the roll-up at the top.

### 4.2) Post-UAT product backlog — intelligence & UX (agreed execution order)

**Gate:** start this backlog **after Phase D (§4.1) is complete** unless a stakeholder explicitly reprioritizes. Empty domains or missing sub-scores on the live service are **expected** until these items ship; they are not Cloud Run deploy blockers.

**Rationale (short):** The UI (`ThreatDeepDive`, radar) assumes **eight domain IDs** and optional **`findings[].score`** for IDX badges. Today `report.risks` is mostly whatever Gemini returns, so sparse domains and findings without scores are a **contract gap**, not random “lost config.”

**Do in this order (tick when done):**

- [ ] **P1 — Normalize eight domains on the server** — After each intelligence parse, merge AI `risks[]` with a fixed list (`geopolitics`, `climate`, `ai`, `nature`, `cyber`, `bio`, `finance`, `social`): for any missing `id`, inject a placeholder row (e.g. sensible `score`/`threshold`, Thai/EN labels, `sourceName` like “รอสัญญาณจากแหล่งข้อมูล”) so the client always receives eight entries. Improves deep-insight screen and radar consistency. *Primary file: `server.ts`.*

- [ ] **P2 — Prompt + JSON shape for sub-threat indices** — Extend the Gemini system prompt / example output so each `findings[]` item includes **`score` (0–100)** and **`severity`** (`low` | `medium` | `high` | `critical`) whenever there is a real event. Matches `src/types.ts` (`RiskFinding`) and unlocks the existing IDX chip in `ThreatDeepDive.tsx`. *Files: `server.ts`, optionally `src/types.ts` if tightening types.*

- [ ] **P3 — Optional deterministic sub-scores** — For feeds with structured metrics (e.g. earthquake magnitude), compute a sub-`score` on the server so UX does not depend solely on the model for those rows. *File: `server.ts` (near ingest / post-process).*

- [ ] **P4 — Main dashboard vs detail (product + UI)** — Decide whether the home “threat alerts” strip should show **aggregate/summary** vs **per-event rows**; then adjust components accordingly. *Requires product sign-off before large UI changes.*

*Reference for issues/PRs:* `BACKLOG-P1` … `BACKLOG-P4`.

## 5) CIS Level 1 aligned controls (practical baseline)

- Keep secrets in Secret Manager only (never in source).
- Enable security headers and disable framework fingerprinting (already implemented in `server.ts`).
- Keep service least-privilege:
  - Prefer dedicated runtime service account
  - Grant only required IAM roles
- Enable auditability:
  - Cloud Audit Logs
  - Cloud Run request logs and alerting
- Limit blast radius:
  - max instances cap (`_MAX_INSTANCES` + Cloud Run limits)
  - request body limit
  - timeout limit
- Patch process:
  - run dependency updates monthly
  - track `npm audit` critical and high findings

## 6) Legal and policy resilience checklist

- Define data classification: no PII by default, redact logs.
- Define retention policy for logs and security events.
- Publish privacy notice and data source attribution page.
- Regional data strategy: deploy in approved region(s) only.
- Maintain incident response playbook and rollback procedure.
- Keep infrastructure as code and documented change approvals.

## 7) Scale and ads readiness

- Scale:
  - increase `_MAX_INSTANCES` and/or `cpu` during high traffic windows (re-run **§4.1** and watch for duplicate background jobs / cost)
  - reduce polling frequency and payload size to lower cost (`TACTICAL_PULSE_MS`, client poll interval if configured)
- Ads:
  - add a dedicated config flag (for consent-aware ad rendering)
  - gate ad scripts by locale and consent status
  - isolate ad network failures so dashboard still functions
