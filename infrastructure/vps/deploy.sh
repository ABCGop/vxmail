#!/bin/bash
# ==============================================================================
# VxMail Production Deployment Script for VPS
# Ecosystem: VxMusic (vxmusic.in)
# ==============================================================================

set -e

echo "🚀 Starting VxMail Production Deployment..."

# 1. Update OS and install dependencies
echo "📦 Updating system packages..."
apt-get update -y
apt-get install -y curl wget git ufw certbot openssl fail2ban

# 2. Configure Firewall (UFW)
echo "🛡️ Configuring Firewall rules for Web & Mail..."
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp      # SSH
ufw allow 80/tcp      # HTTP (Certbot & Web redirect)
ufw allow 443/tcp     # HTTPS (VxMail Web Client)
ufw allow 25/tcp      # Inbound SMTP (Stalwart MX)
ufw allow 587/tcp     # Outbound Submission (STARTTLS)
ufw allow 465/tcp     # SMTPS (Implicit TLS)
ufw allow 993/tcp     # IMAP SSL
ufw --force enable

# 3. Install Docker & Docker Compose if not already installed
if ! command -v docker &> /dev/null; then
    echo "🐳 Installing Docker Engine..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
fi

# 4. Generate DKIM 2048-bit Signing Key for vxmusic.in
echo "🔑 Generating DKIM Keys for vxmusic.in..."
mkdir -p ./infrastructure/vps/dkim
if [ ! -f ./infrastructure/vps/dkim/vxmail2026.private.key ]; then
    openssl genrsa -out ./infrastructure/vps/dkim/vxmail2026.private.key 2048
    openssl rsa -in ./infrastructure/vps/dkim/vxmail2026.private.key -pubout -out ./infrastructure/vps/dkim/vxmail2026.public.key
    chmod 600 ./infrastructure/vps/dkim/vxmail2026.private.key
    echo "✅ DKIM Private and Public keys generated."
    
    echo "==================== [DNS DKIM RECORD TO ADD] ===================="
    echo "Host / Name:  vxmail2026._domainkey.vxmusic.in"
    echo "Record Type:  TXT"
    DKIM_PUB=$(grep -v -- "-----" ./infrastructure/vps/dkim/vxmail2026.public.key | tr -d '\n')
    echo "Value:        v=DKIM1; k=rsa; p=$DKIM_PUB"
    echo "=================================================================="
fi

# 5. Provision SSL Certificate for mail.vxmusic.in
echo "🔒 Checking SSL Certificates for mail.vxmusic.in..."
if [ ! -d "/etc/letsencrypt/live/mail.vxmusic.in" ]; then
    echo "Generating Let's Encrypt Certificate..."
    certbot certonly --standalone -d mail.vxmusic.in --non-interactive --agree-tos -m admin@vxmusic.in || {
        echo "⚠️ Certbot standalone failed. Generating self-signed fallback for initial boot..."
        mkdir -p /etc/letsencrypt/live/mail.vxmusic.in
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
          -keyout /etc/letsencrypt/live/mail.vxmusic.in/privkey.pem \
          -out /etc/letsencrypt/live/mail.vxmusic.in/fullchain.pem \
          -subj "/CN=mail.vxmusic.in"
    }
fi

# 6. Build and Launch Docker Containers
echo "🚢 Launching Docker Containers with docker-compose.prod.yml..."
docker compose -f ./infrastructure/vps/docker-compose.prod.yml pull || true
docker compose -f ./infrastructure/vps/docker-compose.prod.yml build --no-cache
docker compose -f ./infrastructure/vps/docker-compose.prod.yml up -d

# 7. Run Database Migrations & Initial Seed
echo "⏳ Waiting for PostgreSQL to be healthy..."
sleep 5

echo "🗄️ Executing Prisma Database Migrations..."
docker exec -t vxmail-web cp packages/database/prisma/schema.postgresql.prisma packages/database/prisma/schema.prisma
docker exec -t vxmail-web npx prisma generate --schema=packages/database/prisma/schema.prisma
docker exec -t vxmail-web npx prisma db push --schema=packages/database/prisma/schema.prisma --accept-data-loss
docker exec -t vxmail-web npx tsx packages/database/src/seed.ts
docker restart vxmail-web vxmail-worker

echo "✨ VxMail Production Deployment Completed Successfully!"
echo "🌐 Webmail:   https://mail.vxmusic.in"
echo "📬 SMTP Host: mail.vxmusic.in:25 (MX) / 587 (Submission)"
echo "🔐 IMAP Host: mail.vxmusic.in:993"
