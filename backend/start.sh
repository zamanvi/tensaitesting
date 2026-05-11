#!/bin/sh
LISTEN_PORT="${PORT:-8080}"
echo "=== Tensai starting on PORT=${LISTEN_PORT} ==="

# Sync Apache port with Railway's dynamic PORT
sed -i "s/Listen 8080/Listen ${LISTEN_PORT}/" /etc/apache2/ports.conf
sed -i "s/\*:8080/\*:${LISTEN_PORT}/" /etc/apache2/sites-available/000-default.conf

php artisan migrate --force 2>&1 || echo "Migration warning (non-fatal)"
php artisan config:cache 2>&1 || true
php artisan route:cache 2>&1 || true

echo "=== Starting Apache on port ${LISTEN_PORT} ==="
exec apache2-foreground
