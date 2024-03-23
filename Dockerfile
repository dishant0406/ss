# Stage 1: Installing dependencies
FROM node:lts AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --only=production


# Stage 2: Building the application - This might not be necessary unless you have a build step, because you are just copying files here
FROM node:lts AS builder
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

# Stage 3: Runner
FROM node:lts AS runner
WORKDIR /app
COPY --from=builder /app ./

# Your app binds to port 4000 so you'll use the EXPOSE instruction to have it mapped by the docker daemon
EXPOSE 4000

RUN apt-get update && apt-get install gnupg wget -y && \
  wget --quiet --output-document=- https://dl-ssl.google.com/linux/linux_signing_key.pub | gpg --dearmor > /etc/apt/trusted.gpg.d/google-archive.gpg && \
  sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' && \
  apt-get update && \
  apt-get install google-chrome-stable -y --no-install-recommends && \
  rm -rf /var/lib/apt/lists/*

CMD ["node", "index.js"]