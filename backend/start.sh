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

# Re-apply write permissions on every boot, not just at image build time —
# Railway's persistent volume (mounted over /app/storage) replaces whatever
# the image had there with its own directory, which starts out root-owned
# and not writable by the Apache child processes (www-data). Without this,
# any Blade view not already compiled on disk 500s the first time it's
# rendered (Filament\Pages\Auth\Login was hit first, but it applies to
# every view file_put_contents() has to write fresh).
mkdir -p /app/storage/app/public /app/storage/app/livewire-tmp /app/storage/logs \
         /app/storage/framework/cache/data /app/storage/framework/sessions /app/storage/framework/views \
         /app/bootstrap/cache
chmod -R 777 /app/storage /app/bootstrap/cache

# Livewire's temporary file uploads — deliberately NOT under /app/storage
# (see config/filesystems.php's 'livewire-tmp' disk for why: that path is
# on this same persistent volume, and a temp file written by one worker
# then read back by another moments later intermittently failed). /tmp is
# always local to the container, never volume-backed.
mkdir -p /tmp/livewire-tmp-uploads
chmod -R 777 /tmp/livewire-tmp-uploads

php artisan optimize:clear 2>&1 || true
php artisan migrate --force 2>&1 || echo "Migration warning (non-fatal)"
php artisan db:seed --force 2>&1 || echo "Seed warning (non-fatal)"
php artisan storage:link --force 2>&1 || true
php artisan filament:upgrade 2>&1 || true
php artisan config:cache 2>&1 || true
php artisan route:cache 2>&1 || true

echo "=== Starting Apache on port ${LISTEN_PORT} ==="
exec apache2-foreground
