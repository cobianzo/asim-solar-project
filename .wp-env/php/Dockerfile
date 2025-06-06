FROM wordpress:php8.1

# Instalar Xdebug
RUN pecl install xdebug \
    && docker-php-ext-enable xdebug

# Copiar el archivo de configuración de Xdebug
COPY xdebug.ini /usr/local/etc/php/conf.d/xdebug.ini
