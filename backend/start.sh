#!/bin/sh
echo "=== Tensai starting ==="
php artisan config:clear 2>&1 || true
php artisan cache:clear 2>&1 || true
php artisan view:clear 2>&1 || true
php artisan route:clear 2>&1 || true
php artisan package:discover --ansi || true
php artisan filament:upgrade 2>&1 || true
php artisan migrate --force
php artisan db:seed --force || true
echo "=== Starting Apache on port 8080 ==="
exec apache2-foreground
