FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl

COPY package*.json ./
COPY packages/config/package*.json ./packages/config/
COPY packages/email/package*.json ./packages/email/
COPY packages/database/package*.json ./packages/database/
COPY apps/web/package*.json ./apps/web/

RUN npm install

COPY . .

# Generate Prisma client
RUN npm --workspace=@vxmail/database run generate

# Build Next.js
RUN npm --workspace=@vxmail/web run build

EXPOSE 3000
CMD ["npm", "--workspace=@vxmail/web", "run", "start"]
