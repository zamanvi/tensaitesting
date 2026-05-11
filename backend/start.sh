#!/bin/sh
LISTEN_PORT="${PORT:-8080}"
echo "=== Tensai starting on PORT=${LISTEN_PORT} ==="

# Fix Apache MPM conflict (mpm_event + mpm_prefork cannot both be loaded)
rm -f /etc/apache2/mods-enabled/mpm_event.conf \
      /etc/apache2/mods-enabled/mpm_event.load \
      /etc/apache2/mods-enabled/mpm_worker.conf \
      /etc/apache2/mods-enabled/mpm_worker.load 2>/dev/null || true

# Sync Apache port with Railway's PORT env var
sed -i "s/Listen 8080/Listen ${LISTEN_PORT}/" /etc/apache2/ports.conf
sed -i "s/\*:8080/\*:${LISTEN_PORT}/" /etc/apache2/sites-available/000-default.conf

php artisan migrate --force 2>&1 || echo "Migration warning (non-fatal)"
php artisan config:cache 2>&1 || true
php artisan route:cache 2>&1 || true

echo "=== Starting Apache on port ${LISTEN_PORT} ==="
exec apache2-foreground
