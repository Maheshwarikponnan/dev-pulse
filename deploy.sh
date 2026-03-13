#!/bin/bash

# DevPulse Deployment Script
# Usage: ./deploy.sh [platform] [environment]
# Example: ./deploy.sh digitalocean production

set -e

PLATFORM=${1:-digitalocean}
ENVIRONMENT=${2:-production}

echo "🚀 Deploying DevPulse to $PLATFORM ($ENVIRONMENT)"

# Check prerequisites
check_prerequisites() {
    echo "📋 Checking prerequisites..."

    if ! command -v docker &> /dev/null; then
        echo "❌ Docker is not installed. Please install Docker first."
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null; then
        echo "❌ Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi

    echo "✅ Prerequisites check passed"
}

# Test local build
test_build() {
    echo "🔨 Testing local build..."

    # Test backend build
    echo "Building backend..."
    docker build -t devpulse-backend:test ./backend

    # Test frontend build
    echo "Building frontend..."
    docker build -t devpulse-frontend:test ./frontend

    echo "✅ Local build test passed"
}

# Deploy to DigitalOcean
deploy_digitalocean() {
    echo "🌊 Deploying to DigitalOcean App Platform..."

    echo "Please ensure you have:"
    echo "1. Connected your GitHub repository to DigitalOcean App Platform"
    echo "2. Set the following environment variables in App Platform:"
    echo "   - NODE_ENV=production"
    echo "   - CLIENT_URL=https://your-app-name.ondigitalocean.app"
    echo "   - MONGO_INITDB_ROOT_USERNAME=admin"
    echo "   - MONGO_INITDB_ROOT_PASSWORD=your-secure-password"
    echo ""
    echo "Then trigger a deployment from the DigitalOcean dashboard."
}

# Deploy to Google Cloud
deploy_google_cloud() {
    echo "☁️ Deploying to Google Cloud Run..."

    # Check if gcloud is installed
    if ! command -v gcloud &> /dev/null; then
        echo "❌ gcloud CLI is not installed."
        echo "Install from: https://cloud.google.com/sdk/docs/install"
        exit 1
    fi

    # Authenticate
    echo "Authenticating with Google Cloud..."
    gcloud auth login

    # Set project
    read -p "Enter your Google Cloud project ID: " PROJECT_ID
    gcloud config set project $PROJECT_ID

    # Enable APIs
    echo "Enabling required APIs..."
    gcloud services enable run.googleapis.com
    gcloud services enable containerregistry.googleapis.com

    # Build and push images
    echo "Building and pushing Docker images..."
    docker build -t gcr.io/$PROJECT_ID/devpulse-backend ./backend
    docker build -t gcr.io/$PROJECT_ID/devpulse-frontend ./frontend

    gcloud auth configure-docker
    docker push gcr.io/$PROJECT_ID/devpulse-backend
    docker push gcr.io/$PROJECT_ID/devpulse-frontend

    # Deploy services
    echo "Deploying services..."

    # Get MongoDB URI
    read -p "Enter your MongoDB connection URI: " MONGO_URI

    # Deploy backend
    gcloud run deploy devpulse-backend \
        --image gcr.io/$PROJECT_ID/devpulse-backend \
        --platform managed \
        --port 3001 \
        --allow-unauthenticated \
        --set-env-vars "NODE_ENV=production,MONGODB_URI=$MONGO_URI" \
        --region us-central1

    # Deploy frontend
    gcloud run deploy devpulse-frontend \
        --image gcr.io/$PROJECT_ID/devpulse-frontend \
        --platform managed \
        --port 80 \
        --allow-unauthenticated \
        --region us-central1

    echo "✅ Deployment to Google Cloud completed!"
    echo "Get service URLs with: gcloud run services list"
}

# Main deployment logic
main() {
    check_prerequisites

    case $PLATFORM in
        digitalocean)
            deploy_digitalocean
            ;;
        google|gcp|cloud)
            deploy_google_cloud
            ;;
        test)
            test_build
            ;;
        *)
            echo "❌ Unsupported platform: $PLATFORM"
            echo "Supported platforms: digitalocean, google, test"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"