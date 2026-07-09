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

php artisan optimize:clear 2>&1 || true

# Fix applications.status ENUM to include pool/selected (idempotent, safe to run every deploy)
php artisan tinker --execute="try { \$c = \DB::selectOne(\"SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='applications' AND COLUMN_NAME='status'\"); if(\$c && str_contains(strtolower(\$c->COLUMN_TYPE),'enum') && !str_contains(\$c->COLUMN_TYPE,'pool')) { \DB::statement(\"ALTER TABLE applications MODIFY COLUMN status ENUM('draft','submitted','accepted','rejected','pool','selected') NOT NULL DEFAULT 'draft'\"); echo 'ENUM fixed\n'; } else { echo 'ENUM ok\n'; } } catch(\Throwable \$e) { echo 'skip: '.\$e->getMessage().'\n'; }" 2>&1 || true

php artisan migrate --force 2>&1 || echo "Migration warning (non-fatal)"

# Fix institution_selections.lead_id FK to point to applications (not leads)
php artisan tinker --execute="try { \$fks = \DB::select(\"SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='institution_selections' AND COLUMN_NAME='lead_id' AND REFERENCED_TABLE_NAME='leads'\"); foreach(\$fks as \$fk) { \DB::statement(\"ALTER TABLE institution_selections DROP FOREIGN KEY {\$fk->CONSTRAINT_NAME}\"); } \DB::statement(\"ALTER TABLE institution_selections ADD CONSTRAINT isel_lead_app_fk FOREIGN KEY (lead_id) REFERENCES applications(id) ON DELETE CASCADE\"); echo 'FK fixed'; } catch(\Throwable \$e) { echo 'FK skip: '.\$e->getMessage(); }" 2>&1 || true
php artisan db:seed --force 2>&1 || echo "Seed warning (non-fatal)"
php artisan storage:link --force 2>&1 || true
php artisan filament:upgrade 2>&1 || true
php artisan config:cache 2>&1 || true
php artisan route:cache 2>&1 || true

echo "=== Starting Apache on port ${LISTEN_PORT} ==="
exec apache2-foreground
