#!/bin/sh
echo "=== Tensai starting on PORT=${PORT:-8080} ==="
php artisan package:discover --ansi 2>&1 || true
php artisan migrate --force
php artisan db:seed --force || true
echo "=== Starting Laravel server on PORT=${PORT:-8080} ==="
exec php artisan serve --host=0.0.0.0 --port=${PORT:-8080}
