FROM node:22-slim

RUN apt-get update && apt-get install -y \
    g++ \
    gcc \
    python3 \
    openjdk-17-jdk \
    && rm -rf /var/lib/apt/lists/*


WORKDIR /app


COPY package*.json ./
RUN npm install


COPY . .


EXPOSE 4020


CMD ["node", "src/server.js"]
