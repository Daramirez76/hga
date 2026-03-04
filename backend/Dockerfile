# Dockerfile for Laravel application
FROM php:8.2-fpm

# install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libzip-dev \
    zip \
    unzip \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    && docker-php-ext-install pdo pdo_mysql mbstring zip exif pcntl bcmath gd \
    && pecl install xdebug && docker-php-ext-enable xdebug \
    && rm -rf /var/lib/apt/lists/*

# install composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# copy existing application files
COPY . /var/www/html

# install php dependencies
RUN composer install --no-dev --optimize-autoloader --no-interaction

# ensure storage directories are writable
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

EXPOSE 8000

# default command (artisan serve)
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]
