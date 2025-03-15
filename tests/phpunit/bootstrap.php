<?php

/**
 * Useful for debugging:
 * print_r( getenv() );
 */
echo "getenv\n\n";
print_r( getenv() );

if ( 'tests-mysql' === getenv( 'WORDPRESS_DB_HOST' ) || ! empty( getenv( 'IS_WATCHING' ) ) ) {
	echo "We are in\nWP ENV\n";
	require 'bootstrap-wp-env.php';
	// we are in wp-env (local), we know it because the host is tests-mysql and the db is tests-wordpress
} else {
	echo "We are in\na regular WordPress installation\n";
	// we are in github actions, in wp-content/plugins/aside-related-article-block/ folder of  wordpress installation
	require 'bootstrap-regular-wp.php';
}
return;
