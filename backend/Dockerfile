FROM php:8.1-cli

RUN apt-get update && apt-get install -y \
    git curl zip unzip libzip-dev libpng-dev libonig-dev libxml2-dev libicu-dev \
    && docker-php-ext-install pdo pdo_mysql mbstring zip exif pcntl bcmath intl \
    && apt-get clean

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /app

COPY . .

RUN COMPOSER_ALLOW_SUPERUSER=1 composer install --no-dev --optimize-autoloader --no-interaction

RUN php artisan package:discover --ansi || true

EXPOSE 8080

CMD php artisan serve --host=0.0.0.0 --port=${PORT:-8080}
