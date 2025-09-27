FROM node:22.20-alpine AS builder

COPY . /app

WORKDIR /app

RUN --mount=type=cache,target=/root/.npm-production npm ci --ignore-scripts --omit-dev

RUN --mount=type=cache,target=/root/.npm npm run build

# --- Release Stage ---
FROM node:22-alpine AS release

# Set up a non-root user ('appuser'/'appgroup') to avoid running as root - good security practice!
# (-S is the Alpine option for a system user/group, suitable here)
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy the built code and necessary package files from our builder stage
COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/package.json /app/package.json
COPY --from=builder /app/package-lock.json /app/package-lock.json

ENV NODE_ENV=production

WORKDIR /app

# Give our new 'appuser' ownership of the application files inside /app
# Needs to happen after copying the files over
RUN chown -R appuser:appgroup /app

# Install *only* the production dependencies
RUN npm ci --ignore-scripts --omit-dev

# Now, switch to running as our non-root user for the actual app process
USER appuser

# Define how to start the application
ENTRYPOINT ["node", "dist/index.js"]
