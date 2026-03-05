# Deliverables A & C: Reliability Agent & Scanning Orchestrator

## Target Architecture & Implementation Checklist

### Tech Stack
- **Monorepo**: Turborepo
- **Reliability Agent**: Node.js + Express + OpenAI API SDK (Backend Service)
- **Orchestrator**: Node.js Service triggering GitHub Actions & CLI tests
- **Mobile Controller**: React Native (Expo)

### Implementation Checklist & Acceptance Criteria

- [x] **Project Scaffolding**: Initialized Turborepo for Backend Services and Mobile App.
- [x] **Deliverable A (Reliability Agent)**:
  - [x] Webhook Collector (`/webhook/alert`)
  - [x] Triage Engine (Extracts correlation IDs, normalizes severity)
  - [x] Fix Generator loop mapped (Connects to OpenAI, respects strict budgets).
  - [x] Integration with Admin Dashboard API for Incident tracking.
- [x] **Deliverable C (Orchestrator & Mobile App)**:
  - [x] Orchestrator `/api/scan` endpoint created.
  - [x] React Native Expo skeleton initialized for the phone app.
- [ ] **Runbook Executor**: Implement `restart`, `rollback` functions strictly executing inside Docker/K8s via API.
- [ ] **Mobile App UI**: Build the push-notification inbox and the Approval/Deny Buttons for PRs.

### No Secrets Policy
- All secrets (OpenAI API Keys, Datadog tokens) are loaded strictly through Environment Variables (`process.env`). Nothing is hardcoded.

### OpenAI Budget Configuration
- Limit: $50 / month globally.
- Cap: $5 per incident.
- Requires explicit `OWNER` approval in the DB (via the mobile app) before proceeding if estimated cost exceeds $1.00.

### Execution Loop
1. Datadog sends alert to **Reliability Agent**.
2. Agent normalizes -> sends POST to **DashboardSaas** `/api/incidents`.
3. Agent queries **OpenAI** -> generates git diff -> pushes PR to GitHub.
4. Agent creates an `ApprovalRequest` record on Dashboard DB.
5. **Mobile App** pulls `ApprovalRequest` -> Owner clicks "Approve".
6. Dashboard DB updates status -> Webhook fires back to Agent -> Agent merges PR -> Orchestrator runs e2e tests -> Deploys.
