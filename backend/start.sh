#!/bin/sh
echo "=== Tensai starting ==="
php artisan migrate --force
php artisan config:cache
php artisan route:cache
echo "=== Starting Apache on port 8080 ==="
exec apache2-foreground
