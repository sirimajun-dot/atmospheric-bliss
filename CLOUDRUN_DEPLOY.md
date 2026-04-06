# Cloud Run Launch Plan (Security + Compliance Baseline)

This document prepares `Atmospheric Bliss` for production on Google Cloud Run with a CIS-style Level 1 baseline.

## 1) Prerequisites

- Google Cloud project with billing enabled
- `gcloud` CLI installed and authenticated
- Required APIs enabled:
  - Cloud Run API
  - Cloud Build API
  - Secret Manager API
  - Artifact Registry API

## 2) One-time project setup

```bash
gcloud config set project YOUR_PROJECT_ID
gcloud services enable run.googleapis.com cloudbuild.googleapis.com secretmanager.googleapis.com artifactregistry.googleapis.com
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

## 3) Deploy via Cloud Build

```bash
gcloud builds submit --config cloudbuild.yaml
```

The current `cloudbuild.yaml` deploys with:
- Gen2 execution environment
- autoscaling baseline (`min=0`, `max=20`)
- bounded resources (`1 vCPU`, `512Mi`, `timeout 60s`)
- runtime secrets from Secret Manager
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
curl -sS "$SERVICE_URL/api/state"
```

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
  - max instances cap
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
  - increase `max-instances` and/or `cpu` during high traffic windows
  - reduce polling frequency and payload size to lower cost
- Ads:
  - add a dedicated config flag (for consent-aware ad rendering)
  - gate ad scripts by locale and consent status
  - isolate ad network failures so dashboard still functions
