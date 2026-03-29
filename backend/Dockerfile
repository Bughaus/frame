# Stage 1: Build the application
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies needed for node-gyp and competitive build environments
RUN apk add --no-cache python3 make g++

COPY package*.json ./
COPY prisma ./prisma/

# Install even devDependencies to build the NestJS project
RUN npm ci --legacy-peer-deps

COPY . .

# Generate Prisma client and build the app
RUN npx prisma generate
RUN npm run build

# Stage 2: Create the production image
FROM node:22-alpine AS runner

WORKDIR /app

# Install only production dependencies
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --only=production --legacy-peer-deps

# Copy built assets from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 3000

# Start the application
CMD ["npm", "run", "start:prod"]
