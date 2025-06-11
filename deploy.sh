#!/bin/bash

# SDM Application Deployment Script
# Usage: ./deploy.sh [production|development]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default environment
ENV=${1:-production}

echo -e "${BLUE}🚀 Starting SDM Application Deployment...${NC}"
echo -e "${YELLOW}Environment: $ENV${NC}"

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo -e "${RED}❌ PM2 is not installed. Installing globally...${NC}"
    npm install -g pm2
fi

# Install dependencies with legacy peer deps to handle React version conflicts
echo -e "${BLUE}📦 Installing dependencies (with legacy peer deps)...${NC}"
npm install --legacy-peer-deps || {
    echo -e "${YELLOW}⚠️  Trying with --force flag...${NC}"
    npm install --force || {
        echo -e "${RED}❌ Failed to install dependencies. Please check package.json${NC}"
        exit 1
    }
}

# Build application for production
if [ "$ENV" = "production" ]; then
    echo -e "${BLUE}🔨 Building application...${NC}"
    npm run build || {
        echo -e "${RED}❌ Build failed. Please check for build errors.${NC}"
        exit 1
    }
fi

# Create logs directory if it doesn't exist
echo -e "${BLUE}📁 Creating logs directory...${NC}"
mkdir -p logs

# Stop existing PM2 process if running
echo -e "${YELLOW}🛑 Stopping existing processes...${NC}"
pm2 stop sdm-app 2>/dev/null || true
pm2 delete sdm-app 2>/dev/null || true

# Start application with PM2
echo -e "${BLUE}🎯 Starting application with PM2...${NC}"
if [ "$ENV" = "production" ]; then
    pm2 start ecosystem.config.js --env production || {
        echo -e "${RED}❌ Failed to start PM2 in production mode${NC}"
        exit 1
    }
else
    pm2 start ecosystem.config.js --env development || {
        echo -e "${RED}❌ Failed to start PM2 in development mode${NC}"
        exit 1
    }
fi

# Wait a moment for PM2 to stabilize
sleep 3

# Setup PM2 startup script (if not already done)
echo -e "${BLUE}⚙️  Setting up PM2 startup script...${NC}"
pm2 startup || true
pm2 save

# Show status
echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo -e "${BLUE}📊 Application Status:${NC}"
pm2 status sdm-app

echo -e "${GREEN}🎉 SDM Application is now running on http://0.0.0.0:3001${NC}"
echo -e "${YELLOW}💡 Useful commands:${NC}"
echo -e "  • View logs: ${BLUE}npm run pm2:logs${NC}"
echo -e "  • Monitor: ${BLUE}npm run pm2:monit${NC}"
echo -e "  • Restart: ${BLUE}npm run pm2:restart${NC}"
echo -e "  • Stop: ${BLUE}npm run pm2:stop${NC}" 