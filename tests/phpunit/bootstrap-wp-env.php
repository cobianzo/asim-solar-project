<?php
/**
 * PHPUnit bootstrap file.
 *
 * @package Create_Block_Theme
 *
 * Having problems with it... WIP.
 * I can follow this
 * https://matty.blog/adding-unit-tests-to-your-wordpress-plugin-using-wp-env/
 * which uses
 * wp-env run tests-cli --env-cwd=wp-content/plugins/starter-plugin ./vendor/bin/phpunit.
 * but i think i tried already.
 */




$_tests_dir = getenv( 'WP_TESTS_DIR' );

if ( ! $_tests_dir ) {
	$_tests_dir = '/var/www/html/wordpress-tests-lib';
}

// Forward custom PHPUnit Polyfills configuration to PHPUnit bootstrap file.
$_phpunit_polyfills_path = getenv( 'WP_TESTS_PHPUNIT_POLYFILLS_PATH' );
if ( false !== $_phpunit_polyfills_path ) {
	define( 'WP_TESTS_PHPUNIT_POLYFILLS_PATH', $_phpunit_polyfills_path );
}

if ( ! file_exists( "{$_tests_dir}/includes/functions.php" ) ) {
	echo "Ey ! Could not find {$_tests_dir}/includes/functions.php, have you run bin/install-wp-tests.sh ?" . PHP_EOL; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	exit( 1 );
} else {
	echo "\n✅ Found {$_tests_dir}/includes/functions.php\n";
}

// Give access to tests_add_filter() function.
require_once "{$_tests_dir}/includes/functions.php";

/**
 * Manually load the plugin being tested.
 */
function _manually_load_plugin() {
	echo "\n Activating pluginssss \n";
	require dirname( dirname( __FILE__ ) ) . '/solar.php';
	require dirname( dirname( __FILE__ ) ) . '/plugins/gravityforms.php';
	require dirname( dirname( __FILE__ ) ) . '/plugins/coco-gravity-form-map-field.php';
	require dirname( dirname( __FILE__ ) ) . '/plugins/solar-project.php';
}

tests_add_filter( 'muplugins_loaded', '_manually_load_plugin' );

if ( ! file_exists( "{$_tests_dir}/includes/bootstrap.php" ) ) {
	echo "\nEy ! Could not find {$_tests_dir}/includes/bootstrap.php, have you run bin/install-wp-tests.sh ?" . PHP_EOL; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	exit( 1 );
} else {
	echo "\n✅ Found {$_tests_dir}/includes/bootstrap.php . Calling it\n\n";
}

if ( ! defined( 'ABSPATH' ) ) {
	define( 'ABSPATH', '/var/www/html/' );
}

// Start up the WP testing environment.
require "{$_tests_dir}/includes/bootstrap.php";
