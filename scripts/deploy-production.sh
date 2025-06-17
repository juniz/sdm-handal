#!/bin/bash

# Production Deployment Script untuk SDM App
# Optimized untuk 300 concurrent users

echo "🚀 Starting SDM Production Deployment..."

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "❌ PM2 not found. Installing PM2..."
    npm install -g pm2
fi

# Create logs directory
mkdir -p logs

# Stop existing processes
echo "🛑 Stopping existing processes..."
pm2 stop ecosystem.config.js 2>/dev/null || true
pm2 delete ecosystem.config.js 2>/dev/null || true

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --production

# Build application
echo "🔨 Building application..."
npm run build

# Set system optimizations for high load
echo "⚙️ Setting system optimizations..."

# Increase file descriptor limits
ulimit -n 65536

# Set Node.js memory optimization
export NODE_OPTIONS="--max-old-space-size=2048 --optimize-for-size"

# Start application with production config
echo "🚀 Starting application..."
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup

# Show status
echo "📊 Application Status:"
pm2 status
pm2 monit &

echo "✅ Deployment completed successfully!"
echo "📈 Application optimized for 300 concurrent users"
echo "🔍 Monitor: pm2 monit"
echo "📋 Logs: pm2 logs"
echo "🔄 Reload: pm2 reload ecosystem.config.js --env production"

# Performance recommendations
echo ""
echo "🎯 Performance Recommendations:"
echo "- Monitor CPU usage: should stay below 80%"
echo "- Monitor Memory usage: should stay below 85%"
echo "- Response time target: < 2 seconds"
echo "- Error rate target: < 5%"
echo ""
echo "📊 Load Testing Command:"
echo "npm run load-test" 