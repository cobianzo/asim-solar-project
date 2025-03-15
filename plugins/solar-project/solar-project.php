<?php // phpcs:disable WordPress.Files.FileName.InvalidClassFileName
/**
 * Plugin Name: Solar Project
 * Plugin URI: http://example.com/plugin
 * Description: Complementary code together with coco-gravity-form-map-field, to create the Solar Project experience
 * Version: 2.0.0
 * Author: Your Name
 * Author URI: http://example.com
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
			require_once 'inc/class-helpers.php';
			require_once 'inc/class-hooks.php';
			require_once 'inc/class-solar-api.php';

			add_action( 'init', array( $this, 'init_plugin' ) );
	}


	public function init_plugin() {
			// Code to run during plugin initialization
			add_action('wp_head', function () {
				echo '<style>
				</style>';
			});
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
