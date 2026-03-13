# DevPulse Cloud Deployment Guide

This guide covers deploying DevPulse to various cloud platforms. Since your project is Docker-ready, we'll focus on container-based deployments.

## Prerequisites

Before deploying, you'll need:
- Docker and Docker Compose installed locally
- A cloud account (AWS, Google Cloud, Azure, DigitalOcean, etc.)
- Basic knowledge of cloud consoles
- A domain name (optional, but recommended for production)

## Platform Options

### 🚀 **Option 1: DigitalOcean App Platform (Easiest)**

**Best for:** Beginners, quick deployment, managed service

**Cost:** ~$12/month for basic plan

**Steps:**
1. Create DigitalOcean account
2. Connect GitHub repository
3. App Platform auto-detects Docker Compose
4. Deploy with one click

### ☁️ **Option 2: Google Cloud Run (Recommended)**

**Best for:** Scalable, cost-effective, serverless

**Cost:** Pay-per-use (~$0.0001 per request)

**Steps:**
1. Create Google Cloud project
2. Enable Cloud Run API
3. Build and push Docker images to GCR
4. Deploy services

### 🏗️ **Option 3: AWS ECS/Fargate**

**Best for:** Enterprise, highly scalable

**Cost:** ~$15-30/month depending on usage

**Steps:**
1. Create AWS account
2. Set up ECS cluster
3. Create task definitions
4. Deploy services

### 🔷 **Option 4: Azure Container Apps**

**Best for:** Microsoft ecosystem, enterprise

**Cost:** ~$10-25/month

**Steps:**
1. Create Azure account
2. Set up Container Apps environment
3. Deploy from Docker Compose

---

## Quick Start: DigitalOcean App Platform

### 1. Create Account
- Go to [digitalocean.com](https://digitalocean.com)
- Sign up and add payment method
- Get $200 credit for new users

### 2. Connect Repository
- Go to App Platform → Apps → Create App
- Choose GitHub as source
- Select your `dev-pulse` repository
- Choose `main` branch

### 3. Configure Services
App Platform will auto-detect your `docker-compose.yml`:

```yaml
# It will create 3 services:
# - frontend (static site)
# - backend (web service)
# - mongodb (database)
```

### 4. Environment Variables
Add these environment variables in App Platform:

```
# Backend Environment Variables
NODE_ENV=production
CLIENT_URL=https://your-app-name.ondigitalocean.app
MONGODB_URI=mongodb://admin:password@mongodb:27017/devpulse?authSource=admin

# Database Environment Variables (auto-configured)
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=your-secure-password
```

### 5. Deploy
- Click "Create Resources"
- Wait 5-10 minutes for deployment
- Access your app at `https://your-app-name.ondigitalocean.app`

---

## Alternative: Google Cloud Run

### 1. Setup Google Cloud
```bash
# Install Google Cloud CLI
curl https://sdk.cloud.google.com | bash
gcloud init

# Create project
gcloud projects create devpulse-project
gcloud config set project devpulse-project
```

### 2. Enable APIs
```bash
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
```

### 3. Build and Push Images
```bash
# Build images
docker build -t gcr.io/devpulse-project/devpulse-backend ./backend
docker build -t gcr.io/devpulse-project/devpulse-frontend ./frontend

# Push to Google Container Registry
gcloud auth configure-docker
docker push gcr.io/devpulse-project/devpulse-backend
docker push gcr.io/devpulse-project/devpulse-frontend
```

### 4. Deploy Services
```bash
# Deploy backend
gcloud run deploy devpulse-backend \
  --image gcr.io/devpulse-project/devpulse-backend \
  --platform managed \
  --port 3001 \
  --allow-unauthenticated \
  --set-env-vars "NODE_ENV=production,MONGODB_URI=your-mongodb-uri"

# Deploy frontend
gcloud run deploy devpulse-frontend \
  --image gcr.io/devpulse-project/devpulse-frontend \
  --platform managed \
  --port 80 \
  --allow-unauthenticated
```

---

## Database Options

### MongoDB Atlas (Recommended)
- **Free tier:** 512MB storage
- **URL:** cloud.mongodb.com
- **Setup:** Create cluster → Connect → Get connection string

### Cloud Database Services
- **DigitalOcean:** Managed MongoDB ($15/month)
- **AWS DocumentDB:** MongoDB-compatible ($0.017/hour)
- **Google Cloud Memorystore:** Redis/MongoDB options

---

## Environment Variables for Production

Create a `.env.production` file:

```bash
# Backend
NODE_ENV=production
PORT=3001
CLIENT_URL=https://yourdomain.com
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/devpulse
METRIC_INTERVAL_MS=2000
METRIC_PERSIST_MS=10000

# Frontend (build-time)
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_SOCKET_PATH=/socket.io
```

---

## Security Checklist

- [ ] Use HTTPS (free with most platforms)
- [ ] Set strong database passwords
- [ ] Configure CORS properly
- [ ] Use environment variables for secrets
- [ ] Enable firewall rules
- [ ] Set up monitoring/alerts
- [ ] Regular backups

---

## Cost Estimation

| Platform | Setup Time | Monthly Cost | Free Tier |
|----------|------------|--------------|-----------|
| DigitalOcean App Platform | 10 min | $12-25 | 30-day trial |
| Google Cloud Run | 20 min | $0-10 | $300 credit |
| AWS ECS | 30 min | $15-50 | 12-month free |
| Azure Container Apps | 25 min | $10-30 | $200 credit |

---

## Troubleshooting

### Common Issues:

**Port conflicts:**
- Ensure services use different ports
- Check cloud platform port requirements

**Environment variables:**
- Verify all required env vars are set
- Check variable names match your code

**Database connection:**
- Test connection strings locally first
- Ensure database allows external connections

**Build failures:**
- Check Dockerfiles work locally
- Verify all dependencies are in package.json

---

## Next Steps

1. Choose a platform based on your needs
2. Follow the step-by-step guide
3. Test thoroughly in staging
4. Set up monitoring (we'll add this next)
5. Configure CI/CD for automatic deployments

Would you like me to help you deploy to a specific platform?