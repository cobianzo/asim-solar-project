FROM wordpress:php8.1

RUN apt-get update && apt-get install -y unzip \
  && pecl install xdebug \
  && docker-php-ext-enable xdebug

COPY xdebug.ini /usr/local/etc/php/conf.d/xdebug.ini
