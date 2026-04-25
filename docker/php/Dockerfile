FROM php:8.4-cli

RUN apt-get update && apt-get install -y \
    git curl zip unzip libzip-dev \
    && docker-php-ext-install pdo pdo_mysql

WORKDIR /var/www

COPY ./backend .

CMD php artisan serve --host=0.0.0.0 --port=8000