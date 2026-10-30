FROM node:20-alpine

WORKDIR /app

# Habilita pnpm nativamente en Node 20 mediante Corepack
RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./
RUN pnpm install

EXPOSE 5173

CMD ["pnpm", "run", "dev", "--host"]