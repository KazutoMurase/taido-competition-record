FROM mcr.microsoft.com/playwright:v1.61.0-noble

WORKDIR /work

COPY package.json package-lock.json ./
RUN npm ci --no-audit --progress=false

COPY playwright.config.ts ./
COPY tests ./tests

CMD ["npx", "playwright", "test", "tests/advance-schedule.spec.ts", "--workers=1"]
