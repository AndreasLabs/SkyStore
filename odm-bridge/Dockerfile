FROM oven/bun:1 as builder
WORKDIR /odm-bridge
COPY package.json .
COPY bun.lock .
RUN bun install
COPY . .

FROM oven/bun:1-slim
WORKDIR /odm-bridge
COPY --from=builder /odm-bridge/package.json .
COPY --from=builder /odm-bridge/bun.lock .
COPY --from=builder /odm-bridge/node_modules node_modules
COPY --from=builder /odm-bridge/src src

EXPOSE 3000
CMD ["bun", "src/index.ts"]
