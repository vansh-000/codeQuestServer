# Use Debian-based Node so we can apt-get compilers
FROM node:22-slim

# Prevent interactive prompts (important for Render)
ENV DEBIAN_FRONTEND=noninteractive

# Install compilers and runtimes
# build-essential → gcc, g++, make
# python3 → Python runtime
# openjdk-17-jdk-headless → Java compiler + runtime (no GUI)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    python3 \
    openjdk-17-jdk-headless \
 && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Install dependencies first (better caching)
COPY package*.json ./
RUN npm install --omit=dev

# Copy the rest of the source
COPY . .

# Expose for local dev (Render ignores this but helps locally)
EXPOSE 4020

# Make sure Node knows it's production
ENV NODE_ENV=production

# Start your server
CMD ["node", "src/server.js"]
