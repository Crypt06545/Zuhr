#!/bin/bash
set -e

echo "📦 Setting up monorepo structure..."

# ─── Root level folders ───
mkdir -p apps packages

# ─── Move existing projects into apps/ (git history preserve করার জন্য git mv ব্যবহার করছি) ───
echo "➡️  Moving client -> apps/web"
git mv client apps/web

echo "➡️  Moving server -> apps/auth-service"
git mv server apps/auth-service

# ─── New service skeletons ───
echo "📁 Creating api-gateway skeleton"
mkdir -p apps/api-gateway/src

echo "📁 Creating notification-service skeleton"
mkdir -p apps/notification-service/src/mailer
mkdir -p apps/notification-service/src/email-processor

# ─── Shared packages ───
echo "📁 Creating shared packages"
mkdir -p packages/shared-types/src
mkdir -p packages/shared-common/src

# ─── Root config files ───
touch docker-compose.yml
touch turbo.json
touch package.json
touch .env.example
touch .gitignore

echo "✅ Monorepo structure created!"
echo ""
echo "Current structure:"
tree -I 'node_modules|dist|.git|.next|.turbo' -L 4
