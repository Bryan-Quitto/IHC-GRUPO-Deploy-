FROM denoland/deno:2.1.4

ENV DENO_DIR=/deno-cache
ENV DENO_NO_UPDATE_CHECK=1

WORKDIR /app

RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

COPY supabase/functions/ai-usability-analysis/ ./supabase/functions/ai-usability-analysis/

RUN deno cache --node-modules-dir=auto supabase/functions/ai-usability-analysis/index.ts || true

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD curl -f -X POST http://localhost:8000/ \
  -H "Content-Type: application/json" \
  -d '{"ping": true}' || exit 1

CMD ["deno", "run", \
     "--allow-net", \
     "--allow-env", \
     "--allow-read", \
     "--node-modules-dir=auto", \
     "supabase/functions/ai-usability-analysis/index.ts"]