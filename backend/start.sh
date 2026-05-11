#!/bin/sh
echo "=== Tensai starting on PORT=${PORT:-8080} ==="
php artisan migrate --force 2>&1 || echo "Migration warning (non-fatal)"
php artisan config:cache 2>&1 || true
php artisan route:cache 2>&1 || true
echo "=== Starting Apache ==="
exec apache2-foreground
