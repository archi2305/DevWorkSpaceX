# Frontend Setup

## Prerequisites

- Node.js (v20 or later)
- npm
- Git

## Installation

```bash
git clone <repository-url>
cd DevWorkSpaceX/frontend
npm install
```

## Run Development Server

```bash
npm run dev
```

Open:

http://localhost:3000

## Build

```bash
npm run build
```

## Production

```bash
npm start
```

## Deployment

Production deployment assets are included for Docker, Docker Compose, NGINX, GitHub Actions, health checks, logging, and AWS ECS/Fargate.

- Deployment guide: [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md)
- Architecture diagram: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

Quick local container run:

```bash
cp .env.example .env
docker compose up --build
```
