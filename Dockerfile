FROM node:22.16-alpine AS builder

COPY . /app

WORKDIR /app

RUN --mount=type=cache,target=/root/.npm-production npm ci --ignore-scripts --omit-dev

RUN --mount=type=cache,target=/root/.npm npm run build

# --- Release Stage ---
FROM node:22-alpine AS release

# Install necessary tools and Japanese fonts
RUN apk add --no-cache \
    fontconfig \
    font-noto-cjk \
    ttf-freefont \
    curl \
    unzip \
    chromium \
    nss

# Download and install IPAex fonts for better Japanese support
RUN curl -L "https://moji.or.jp/wp-content/ipafont/IPAexfont/IPAexfont00401.zip" -o font.zip && \
    unzip font.zip && \
    mkdir -p /usr/share/fonts/truetype/ipaex && \
    cp IPAexfont00401/*.ttf /usr/share/fonts/truetype/ipaex/ && \
    rm -rf IPAexfont00401 font.zip

# Update font cache
RUN fc-cache -f -v

# Set Puppeteer to use system Chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Set up a non-root user ('appuser'/'appgroup') to avoid running as root - good security practice!
# (-S is the Alpine option for a system user/group, suitable here)
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy the built code and necessary package files from our builder stage
COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/package.json /app/package.json
COPY --from=builder /app/package-lock.json /app/package-lock.json
COPY --from=builder /app/richmenu-template /app/richmenu-template

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
