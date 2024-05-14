FROM caddy:2.6.2-alpine

COPY Caddyfile /etc/caddy/Caddyfile

HEALTHCHECK --interval=15s --timeout=12s --start-period=60s --retries=3 \
    CMD [ "wget", "--output-document=-", "--quiet", "http://127.0.0.1:9200/_cluster/health?wait_for_status=yellow&timeout=10s" ]
