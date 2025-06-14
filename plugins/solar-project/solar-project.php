<?php // phpcs:disable WordPress.Files.FileName.InvalidClassFileName
/**
 * Plugin Name: Solar Project
 * Plugin URI: http://example.com/plugin
 * Description: Complementary code together with coco-gravity-form-map-field, to create the Solar Project experience
 * Version: 5.0.5
 * Author: cobianzo
 * Author URI: http://cobianzo.com
 * Text Domain: solar-panel
 * License: GPL2
 */

// Exit if accessed directly
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// Main plugin class
class Solar_Project {

	public function __construct() {
			// Initialization code here
			require_once 'inc/class-helper.php';

			require_once 'inc/class-enqueue.php';
			require_once 'inc/class-gravity-hooks.php';
			require_once 'inc/class-notifications.php';

			require_once 'inc/api/class-API.php';
			require_once 'inc/api/class-google-maps-api.php';
			require_once 'inc/api/class-solar-api.php';

			require_once 'inc/class-model-panel.php';
			require_once 'inc/class-gravity-model-panel.php';

			add_action( 'init', array( $this, 'init_plugin' ) );
	}


	public function init_plugin() {
			// Code to run during plugin initialization
			add_action('wp_head', function () {
				echo '<style>
				</style>';
			});

			load_plugin_textdomain( 'solar-project', false, dirname( plugin_basename(__FILE__) ) . '/languages' );

	}

	public function activate() {
			// Code to run during plugin activation
	}

	public function deactivate() {
			// Code to run during plugin deactivation
	}
}

// Instantiate the plugin class
$solar_project = new Solar_Project();

// Activation and deactivation hooks
register_activation_hook( __FILE__, array( $solar_project, 'activate' ) );
register_deactivation_hook( __FILE__, array( $solar_project, 'deactivate' ) );
