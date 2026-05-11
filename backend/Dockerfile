FROM php:8.1-apache

RUN apt-get update && apt-get install -y \
    git curl zip unzip libzip-dev libpng-dev libonig-dev libxml2-dev libicu-dev default-mysql-client \
    && docker-php-ext-install pdo pdo_mysql mbstring zip exif pcntl bcmath intl \
    && rm -f /etc/apache2/mods-enabled/mpm_event.conf \
             /etc/apache2/mods-enabled/mpm_event.load \
             /etc/apache2/mods-enabled/mpm_worker.conf \
             /etc/apache2/mods-enabled/mpm_worker.load \
    && a2enmod rewrite headers \
    && apt-get clean

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /app

COPY . .

RUN COMPOSER_ALLOW_SUPERUSER=1 composer install --no-dev --optimize-autoloader --no-interaction --no-scripts --no-plugins

RUN mkdir -p /app/bootstrap/cache /app/storage/logs /app/storage/framework/cache/data /app/storage/framework/sessions /app/storage/framework/views \
    && chmod -R 777 /app/bootstrap/cache /app/storage

COPY apache.conf /etc/apache2/sites-available/000-default.conf
RUN printf 'Listen 8080\n' > /etc/apache2/ports.conf

EXPOSE 8080

COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh
CMD ["/app/start.sh"]
