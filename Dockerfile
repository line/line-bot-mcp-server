ARG NODE_IMAGE=node:24.17.0-bookworm-slim@sha256:c2d5ade763cacfb03fe9cb8e8af5d1be5041ff331921fa26a9b231ca3a4f780a

FROM ${NODE_IMAGE} AS builder

COPY . /app

WORKDIR /app

RUN --mount=type=cache,target=/root/.npm-production npm ci --ignore-scripts

RUN --mount=type=cache,target=/root/.npm npm run build

# --- Release Stage ---
FROM ${NODE_IMAGE} AS release

# Install necessary tools and base fonts
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    fontconfig \
    fonts-noto-cjk \
    fonts-freefont-ttf \
    curl \
    unzip \
    chromium \
    libnss3 \
    && rm -rf /var/lib/apt/lists/*

# Download and install Japanese fonts from GitHub
RUN mkdir -p /usr/share/fonts/truetype/google && \
    # Noto Sans JP from GitHub
    curl -L "https://github.com/googlefonts/noto-cjk/raw/main/Sans/OTF/Japanese/NotoSansJP-Regular.otf" -o /usr/share/fonts/truetype/google/NotoSansJP-Regular.otf && \
    curl -L "https://github.com/googlefonts/noto-cjk/raw/main/Sans/OTF/Japanese/NotoSansJP-Bold.otf" -o /usr/share/fonts/truetype/google/NotoSansJP-Bold.otf && \
    # IPAex Gothic font as fallback
    curl -L "https://moji.or.jp/wp-content/ipafont/IPAexfont/IPAexfont00401.zip" -o ipaex.zip && \
    unzip ipaex.zip && \
    cp IPAexfont00401/*.ttf /usr/share/fonts/truetype/google/ && \
    rm -rf IPAexfont00401 ipaex.zip

# Update font cache
RUN fc-cache -f -v

# Set Puppeteer to use system Chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Set up a non-root user ('appuser'/'appgroup') to avoid running as root - good security practice!
RUN groupadd --system appgroup && useradd --system --gid appgroup appuser

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
RUN npm ci --ignore-scripts --omit=dev

# Now, switch to running as our non-root user for the actual app process
USER appuser

# Define how to start the application
ENTRYPOINT ["node", "dist/index.js"]
