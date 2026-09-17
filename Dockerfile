FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY src/ ./src/

# CI gate (vista-255d3ac4): run the PLATFORM_FRAMES schema/template contract
# checks as part of the image build, so a broken registry fails the build
# instead of shipping. The full unit suite runs via `npm test`
# (test/run-unit.js); this file gates the contract checks specifically.
COPY test/ ./test/
RUN node test/unit/platform-frames-schema.test.js && rm -rf test

# Non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
USER nodejs

EXPOSE 3000

ENV NODE_ENV=production

CMD ["node", "src/server.js"]
