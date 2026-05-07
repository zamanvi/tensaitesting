#!/bin/sh
echo "=== Tensai starting on PORT=${PORT:-8080} ==="
php artisan migrate --force
php artisan db:seed --force
echo "=== Migrations done, starting server ==="
exec php -S 0.0.0.0:${PORT:-8080} -t public
