#!/bin/bash
set -e

echo "🚀 Deploying FinVault..."

cd /var/www/finvault

echo "📦 Pulling latest code..."
git pull origin main

echo "📥 Installing dependencies..."
npm install

echo "🔨 Building..."
npm run build

echo "♻️  Restarting app..."
pm2 reload ecosystem.config.cjs --env production || pm2 start ecosystem.config.cjs --env production

echo "✅ Deploy complete!"
pm2 status
