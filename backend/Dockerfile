FROM php:8.1-apache

RUN apt-get update && apt-get install -y \
    git curl zip unzip libzip-dev libpng-dev libonig-dev libxml2-dev libicu-dev default-mysql-client \
    && docker-php-ext-install pdo pdo_mysql mbstring zip exif pcntl bcmath intl \
    && a2enmod rewrite headers \
    && apt-get clean

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /app

COPY . .

RUN COMPOSER_ALLOW_SUPERUSER=1 composer install --no-dev --optimize-autoloader --no-interaction --no-scripts --no-plugins

RUN mkdir -p /app/bootstrap/cache /app/storage/logs /app/storage/framework/cache/data /app/storage/framework/sessions /app/storage/framework/views \
    && chmod -R 777 /app/bootstrap/cache /app/storage

# Point DocumentRoot to /app/public
RUN sed -i 's|DocumentRoot /var/www/html|DocumentRoot /app/public|' /etc/apache2/sites-available/000-default.conf

# Grant access to /app/public and enable .htaccess (Apache denies /app by default)
RUN printf '\n<Directory /app/public>\n    AllowOverride All\n    Require all granted\n</Directory>\n' >> /etc/apache2/apache2.conf

# Listen on port 8080
RUN printf 'Listen 8080\n' > /etc/apache2/ports.conf \
    && sed -i 's/:80>/:8080>/' /etc/apache2/sites-available/000-default.conf

EXPOSE 8080

COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh
CMD ["/app/start.sh"]
