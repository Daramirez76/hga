FROM php:8.2-cli

RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    unzip \
    zip \
    libonig-dev \
    libpng-dev \
    libxml2-dev \
    libzip-dev \
    default-mysql-client \
    && docker-php-ext-install bcmath exif gd mbstring pcntl pdo pdo_mysql zip \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY composer.json composer.lock ./
RUN composer install --no-dev --no-interaction --no-progress --prefer-dist --optimize-autoloader --no-scripts

COPY . .

RUN composer dump-autoload --optimize \
    && rm -f bootstrap/cache/*.php \
    && mkdir -p storage/framework/cache storage/framework/sessions storage/framework/views storage/logs bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache

EXPOSE 8000

CMD ["sh", "-c", "php artisan config:clear && php artisan migrate --force && php artisan serve --host=0.0.0.0 --port=${PORT:-8000}"]
