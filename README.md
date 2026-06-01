# Portfolio App — Multi-Cloud Portfolio

[![CI/CD](https://github.com/nawazishkhan3009/portfolio-app/actions/workflows/ci.yml/badge.svg)](https://github.com/nawazishkhan3009/portfolio-app/actions/workflows/ci.yml)

React + Go application powering [nawazishkhan.click](https://nawazishkhan.click), a production-grade portfolio demonstrating multi-cloud Kubernetes, GitOps, and observability.

## Project Journey

This project started with an ambitious plan and evolved organically as real-world constraints kicked in.

### The Original Plan

The goal was to follow the **3-repo GitOps pattern** used by cloud-native teams — a clean separation of concerns across three repositories:

```
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│   app repo          │    │   infra repo         │    │   gitops repo        │
│   (app code)        │    │   (IaC)              │    │   (K8s manifests)   │
│                     │    │                      │    │                     │
│ · React frontend    │    │ · Terraform          │    │ · Argo CD apps      │
│ · Go API            │    │ · AWS/Azure/GCP      │    │ · Kustomize overlays│
│ · Dockerfiles       │    │ · VPCs, clusters     │    │ · Helm values       │
│ · Unit tests        │    │ · DNS, certs         │    │ · Environment config│
│ · GitHub Actions CI │    │ · GitHub Actions     │    │                     │
│   (build & push)    │    │   (terraform plan/   │    │ Argo CD watches     │
│                     │    │    apply)            │    │ THIS repo           │
└─────────────────────┘    └─────────────────────┘    └─────────────────────┘
        │                            │                          ▲
        │ on push:                   │ on push:                 │
        │ build image                │ provision infra          │ syncs to
        │ push to GHCR               │                          │ clusters
        │ update image tag ──────────────────────────────────────┘
          in gitops repo
```

The original phasing looked straightforward on paper:

```
Phase 0 → Local (Minikube)       1-2 days
Phase 1 → AWS EKS                1-2 days
Phase 2 → Azure AKS              1-2 days  (pattern already proven)
Phase 3 → GCP GKE                1-2 days  (same again)
Phase 4 → Polish                 1-2 days
────────────────────────────────────────
Total                            ~1 week

Phase 5 → k3s migration          1 week    (separate project)
```

### What Actually Happened

Reality had other ideas. Here's how each phase played out:

**Phase 0 — Docker & basic app (`portfolio-app`)**  
The app repo came first: a React frontend, a Go backend with Prometheus metrics, multi-stage Dockerfiles, and a GitHub Actions pipeline to build and push images to Docker Hub. Docker Compose handled local iteration. This was the foundation everything else would build on.

**Phase 1 — GitOps & Minikube (`portfolio-app` + `portfolio-gitops`)**  
Before touching any cloud, the GitOps repo was stood up alongside Minikube locally. Helm charts, ArgoCD, and the image-tag update pipeline were all validated here first. The infra repo didn't exist yet — just two repos and a local cluster. This turned out to be the right call: the GitOps pattern was proven before any cloud money was spent.

**Phase 2 — GCP GKE (`portfolio-infra` born)**  
GCP came first instead of AWS for one practical reason: $300 in free credits and the simplest managed Kubernetes of the three clouds. GKE's zonal control plane is free, `terraform apply` provisions the cluster in minutes, and a single bootstrap script installs nginx-ingress, cert-manager, and ArgoCD. The infra repo was created at this point to hold the Terraform. The planned k3s migration phase became irrelevant here — there was no reason to migrate away from a managed cluster that worked.

**Phase 3 — Azure k3s (not AKS)**  
The original plan called for AKS. The reality: Azure's free tier gives you a VM, not a managed cluster. AKS has no free control plane tier. So the choice was either pay for AKS or run k3s on the free B2ats_v2 VM. k3s it was — and this turned into the most technically interesting phase of the project. The 1GB RAM constraint forced real optimisation: disabling Azure agents, sequential FluxCD installation to avoid OOM kills, replacing Traefik with nginx on the VM, and a 256MB emergency swapfile. What was planned as "1-2 days, pattern already proven" took significantly longer and taught far more.

**Phase 4 — AWS (in progress)**  
Following the same k3s-on-VM pattern established in Phase 3, using a t3.micro EC2 instance. Terraform provisions the instance, Ansible handles k3s and FluxCD bootstrap. The "separate k3s migration week" from the original plan never materialised as its own phase — it was simply absorbed into Phases 3 and 4 out of necessity.

### Plan vs Reality

| Original Plan | What Happened |
|---------------|---------------|
| Minikube → AWS EKS → Azure AKS → GCP GKE | Minikube → GCP GKE → Azure k3s → AWS k3s |
| Managed Kubernetes everywhere | Managed only on GCP; k3s on Azure and AWS |
| k3s migration as a separate week-long phase | Absorbed into cloud phases by necessity |
| ~1 week total | Ongoing; each cloud phase took longer and taught more |
| 2 repos initially | 3 repos from Phase 1 onwards |



## Architecture

    Browser → Ingress/LoadBalancer → nginx (React SPA) + Go API

**Two services, zero databases, zero persistent volumes** — designed to run on free-tier infrastructure.

| Service | Technology | Port | Purpose |
|---------|-----------|------|---------|
| Frontend | React + Vite, served by nginx | 80 | Portfolio website |
| Backend | Go with Prometheus instrumentation | 8080 | Health checks, metrics, cluster status |

## API Endpoints

| Endpoint | Method | Response | Purpose |
|----------|--------|----------|---------|
| `/api/status` | GET | JSON | Returns cluster health status (GCP, Azure, AWS) |
| `/api/metrics` | GET | Plain text | Custom application metrics (uptime, goroutines) |
| `/metrics` | GET | Prometheus text | Prometheus-scrapable application metrics |

## Local Development

    git clone https://github.com/nawazishkhan3009/portfolio-app.git
    cd portfolio-app
    docker compose up

Frontend: http://localhost:3000  
Backend: http://localhost:8080

## CI/CD Pipeline

Triggered on every push to `main` via GitHub Actions.

**Workflow Steps:**
1. Checkout `portfolio-app`
2. Build & Push Docker images to Docker Hub:
   - `nawnwa/portfolio-frontend:latest` + commit SHA tag
   - `nawnwa/portfolio-backend:latest` + commit SHA tag
3. Checkout `portfolio-gitops` repository
4. Update image tags in `charts/portfolio/values.yaml` with new commit SHA
5. Commit & Push to `portfolio-gitops` (using `GITOPS_PAT` secret)

**Why This Works:**
- FluxCD on Azure watches `portfolio-gitops` → auto-syncs new images
- ArgoCD on GKE watches `portfolio-gitops` → auto-syncs new images
- No manual `kubectl apply` ever needed

## Required GitHub Secrets

| Secret | Purpose |
|--------|---------|
| `DOCKER_USERNAME` | Docker Hub username |
| `DOCKER_PASSWORD` | Docker Hub password/token |
| `GITOPS_PAT` | Personal Access Token with write access to `portfolio-gitops` |

## Container Structure

### Frontend (Multi-stage Dockerfile)

    # Stage 1: Build React app
    FROM node:22-alpine AS build
    WORKDIR /app
    COPY package.json ./
    RUN npm install
    COPY . .
    RUN npm run build

    # Stage 2: Serve with nginx
    FROM nginx:alpine
    COPY --from=build /app/dist /usr/share/nginx/html
    COPY nginx.conf /etc/nginx/conf.d/default.conf
    EXPOSE 80

nginx proxies `/api/*` and `/metrics` to the backend service:

    location /api/ {
        proxy_pass http://backend:8080;
    }
    location /metrics {
        proxy_pass http://backend:8080;
    }

### Backend (Multi-stage Dockerfile)

    # Stage 1: Build Go binary
    FROM golang:1.21-alpine AS build
    WORKDIR /app
    COPY go.mod go.sum ./
    RUN go mod download
    COPY main.go ./
    RUN CGO_ENABLED=0 go build -o backend .

    # Stage 2: Run binary
    FROM alpine:3.18
    WORKDIR /app
    COPY --from=build /app/backend .
    EXPOSE 8080
    CMD ["./backend"]

## Environment Variables

Set via Helm values, injected into pods:

| Variable | Purpose | Example |
|----------|---------|---------|
| `CLUSTER_GCP_URL` | GKE backend health endpoint | `https://gcp.nawazishkhan.click` |
| `CLUSTER_AZURE_URL` | Azure k3s backend health endpoint | `https://azure.nawazishkhan.click` |
| `CLUSTER_AWS_URL` | AWS k3s backend health endpoint | `https://aws.nawazishkhan.click` |

## Tech Stack

| Category | Technology |
|----------|------------|
| Frontend | React 18, Vite, nginx |
| Backend | Go 1.21, Prometheus client |
| CI | GitHub Actions |
| Registry | Docker Hub (`nawnwa/portfolio-*`) |
| Local Dev | Docker Compose |
| Local Test | Ubuntu, WSL2, Minikube, Multipass |

## Development Environment

The entire project was developed and tested on **WSL2 Ubuntu** with **Docker Desktop** running on Windows. This allowed seamless local development with Docker Compose, followed by testing on Minikube before deploying to cloud providers.

### Evolution of Deployments

Each deployment added or changed components as needed:

| Environment | Platform | HTTPS | Key Learnings |
|-------------|----------|-------|---------------|
| Local Dev | Docker Compose | No | Quick iteration, hot reload |
| Local Test | Minikube | No | Kubernetes manifests, ingress basics |
| GCP | GKE (managed) | Yes | Managed control plane, cert-manager, ArgoCD |
| Azure | K3s on VM | Yes | 1GB RAM constraint, FluxCD, NodePort, nginx on VM |
| AWS (Planned) | K3s on EC2 | Yes | Terraform + Ansible, minimal bootstrap |

## Live Deployments

| Cloud | URL | Kubernetes | Status |
|-------|-----|------------|--------|
| Global | [nawazishkhan.click](https://nawazishkhan.click) | Route53 Latency Routing | LIVE |
| GCP | [gcp.nawazishkhan.click](https://gcp.nawazishkhan.click) | GKE (managed) | LIVE |
| Azure | [azure.nawazishkhan.click](https://azure.nawazishkhan.click) | K3s on VM | LIVE |
| AWS | [aws.nawazishkhan.click](https://aws.nawazishkhan.click) | K3s on EC2 | IN-PROGRESS |

## Cost Breakdown

| Resource | GCP | Azure | AWS (Planned) |
|----------|-----|-------|---------------|
| Control Plane / VM | $0 (zonal free tier) | $0 (B2ats_v2, 12 months free) | $0 (t3.micro, 12 months free) |
| Compute / Node | ~$25-30 (e2-small spot) | $0 (included in VM) | $0 (included in VM) |
| Static IP | $0 (when attached) | $0 (when attached) | $0 (Elastic IP, when attached) |
| Storage | Included | ~$2 (30GB SSD after free tier) | Included (30GB gp2) |
| Data Transfer | Free within region | Free within region | Free within region |
| **Total Monthly** | **~$25-30** | **$0** (first 12 months) | **$0** (first 12 months) |
| **After Free Tier** | **~$25-30** (no free tier, only credits) | **~$2** (VM no longer free) | **~$2** (VM no longer free) |

## Key Lessons Learned

| Lesson | Cloud |
|--------|-------|
| Azure free tier VMs all have 1GB RAM — requires aggressive optimization | Azure |
| Disable cloud agents before k3s — saves 200MB on Azure | Azure |
| Sequential FluxCD install — prevents OOM on 1GB | Azure |
| Static NodePorts are essential — survive k3s restarts | Azure |
| Traefik too heavy for 1GB — nginx on VM is 25x lighter | Azure |
| DNS must propagate before certbot — HTTP-01 challenge fails otherwise | Azure |
| Swap as emergency buffer only — `swappiness=10` ensures RAM is primary | Azure |
| Single cloud-init file — VM is truly immutable, reproducible in seconds | Azure |
| GKE zonal control plane is free — regional costs $73/month | GCP |
| Spot instances reduce cost but can be preempted | GCP |
| Disable GKE logging/monitoring to avoid hidden costs | GCP |

## Next Plans
- [ ] **AWS k3s:** Terraform + Ansible, join multi-cloud deployment
- [ ] **Global Load Balancing** — Route53 latency-based routing across all three clouds
- [ ] **Multi Arch/Platform Build/Deployment** — Deploy on ARM-based VM using buildx
- [ ] **Grafana:** Deploy on GKE, single pane of glass for all 3 clusters
- [ ] **Prometheus:** Per-cluster deployment scraping `/metrics`
- [ ] **Observability** — Prometheus + Grafana single pane of glass
- [ ] **Alerting** — Alert on cluster health check failures

## Future Upgrades
- [ ] **Oracle Cloud:** Permanent free VM replacement for Azure after 12 months
- [ ] **CI for infra:** `terraform plan` on PR
- [ ] **Website Features** (German + Dark Mode button), dedicated health status API
- [ ] **Website Portfolio** — CV/Resume PDF upload

## Security Notes

- SSH keys passed via `TF_VAR_ssh_public_key`, never committed
- AWS credentials for Route53 stored as Kubernetes secrets
- Docker Hub credentials in GitHub Secrets only
- `GITOPS_PAT` with minimal scope (write to `portfolio-gitops` only)
- Network Security Groups allow only HTTP/HTTPS/SSH
- cert-manager DNS-01 uses dedicated IAM user with Route53-only permissions

---

## Related Repositories

| Repository | Purpose |
|------------|---------|
| [portfolio-gitops](https://github.com/nawazishkhan3009/portfolio-gitops) | Helm charts and values files; watched by ArgoCD (GKE) and FluxCD (Azure) for GitOps deployments |
| [portfolio-infra](https://github.com/nawazishkhan3009/portfolio-infra) | Terraform Deployment files and bootstrap bash scripts

---

## Tech Stack

| ☁️ Cloud & Kubernetes | 🔄 GitOps & CI/CD | 🏗️ Infrastructure | 💻 Application | 📊 Observability |
|---|---|---|---|---|
| ![GCP](https://img.shields.io/badge/GCP_GKE-4285F4?style=flat&logo=googlecloud&logoColor=white) | ![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?style=flat&logo=githubactions&logoColor=white) | ![Terraform](https://img.shields.io/badge/Terraform-844FBA?style=flat&logo=terraform&logoColor=white) | ![Go](https://img.shields.io/badge/Go-00ADD8?style=flat&logo=go&logoColor=white) | ![Prometheus](https://img.shields.io/badge/Prometheus-E6522C?style=flat&logo=prometheus&logoColor=white) |
| ![Azure](https://img.shields.io/badge/Azure_K3s-0078D4?style=flat&logo=microsoftazure&logoColor=white) | ![ArgoCD](https://img.shields.io/badge/Argo_CD-EF7B4D?style=flat&logo=argo&logoColor=white) | ![Ansible](https://img.shields.io/badge/Ansible-EE0000?style=flat&logo=ansible&logoColor=white) | ![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black) | ![Grafana](https://img.shields.io/badge/Grafana-F46800?style=flat&logo=grafana&logoColor=white) |
| ![AWS](https://img.shields.io/badge/AWS_K3s-FF9900?style=flat&logo=amazonwebservices&logoColor=white) | ![Flux CD](https://img.shields.io/badge/Flux_CD-5468FF?style=flat&logo=flux&logoColor=white) | ![Route53](https://img.shields.io/badge/Route_53-FF9900?style=flat&logo=amazonroute53&logoColor=white) | ![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white) | ![AlertManager](https://img.shields.io/badge/AlertManager-E6522C?style=flat&logo=prometheus&logoColor=white) |
| ![Kubernetes](https://img.shields.io/badge/Kubernetes-326CE5?style=flat&logo=kubernetes&logoColor=white) | ![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white) | ![cert-manager](https://img.shields.io/badge/cert--manager-00ADD8?style=flat&logo=letsencrypt&logoColor=white) | | |
| ![Helm](https://img.shields.io/badge/Helm-0F1689?style=flat&logo=helm&logoColor=white) | | ![nginx](https://img.shields.io/badge/nginx-009639?style=flat&logo=nginx&logoColor=white) | | |