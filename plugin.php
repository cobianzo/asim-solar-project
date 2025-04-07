<?php
/*
Plugin Name: Base plugin not in use
Plugin URI: http://example.com/plugin
Description: We create this complementary plugin to help on testing (phpunit and e2e). We will create and admin page that helps to create dummy data with one click.
Version: 1.0
Author: cobianzo
Author URI: http://cobianzo.com
License: GPL2
*/

// We need this to use .env
$vendor_path = __DIR__ . '/vendor/autoload.php';
if ( file_exists( $vendor_path ) ) {
	require_once $vendor_path;
}
// Cargar .env
if ( class_exists( 'Dotenv\Dotenv' ) ) {
	$dotenv = Dotenv\Dotenv::createImmutable( __DIR__ );
	$dotenv->load();
}


add_action('admin_menu', function () {
	add_options_page(
		'Testing Page', // Page title
		'Testing Page', // Menu title
		'manage_options', // Capability
		'testing-page', // Menu slug
		function () {
			// Callback function


			if ( isset( $_POST['setup_plugins_and_tests_nonce'] ) ) {
				if ( ! wp_verify_nonce( sanitize_text_field( $_POST['setup_plugins_and_tests_nonce'] ), 'setup_plugins_and_tests_action' ) ) {
					wp_die( 'Nonce verification failed.' );
				}

				$message_output = '';


				// 1) activate the plugins Gravity forms and Solar Project
				// Activate the Gravity Forms plugin
				if ( ! is_plugin_active( 'gravityforms/gravityforms.php' ) ) {
					activate_plugin( 'gravityforms/gravityforms.php' );
					$message_output .= 'Gravity Forms plugin activated.<br>';
				}
				if ( ! is_plugin_active( 'coco-gravity-form-map-field/coco-gravity-form-map-field.php' ) ) {
					activate_plugin( 'coco-gravity-form-map-field/coco-gravity-form-map-field.php' );
					$message_output .= 'Map Field Plugin activated.<br>';
				}
				if ( ! is_plugin_active( 'solar-project/solar-project.php' ) ) {
					activate_plugin( 'solar-project/solar-project.php' );
					$message_output .= 'Solar Project plugin activated.<br>';
				}



				// 2) setup the values for the gravity forms Google API key  and Map ID, from .env values

				// Retrieve the current settings
				$current_settings = \Coco_Gravity_Form_Map_Field\Addon_Coco::get_instance()->get_plugin_settings();
				if ( ! $current_settings ) {
					$current_settings = array();
				}

				if ( empty( $current_settings[ \Coco_Gravity_Form_Map_Field\Addon_Coco::SETTING_GOOGLE_MAPS_API_KEY ] ) ) {
					$api = isset( $_ENV['GRAVITY_FORMS_GOOGLE_PLACES_API_KEY'] ) ? sanitize_text_field( $_ENV['GRAVITY_FORMS_GOOGLE_PLACES_API_KEY'] ) ?? '' : '';
					$current_settings[ \Coco_Gravity_Form_Map_Field\Addon_Coco::SETTING_GOOGLE_MAPS_API_KEY ] = $api;
				}
				if ( empty( $current_settings[ \Coco_Gravity_Form_Map_Field\Addon_Coco::SETTING_GOOGLE_MAP_ID_KEY ] ) ) {
					$mapid = isset( $_ENV['GRAVITY_FORMS_GOGLE_MAP_ID'] ) ? sanitize_text_field( $_ENV['GRAVITY_FORMS_GOGLE_MAP_ID'] ) ?? '' : '';
					$current_settings[ \Coco_Gravity_Form_Map_Field\Addon_Coco::SETTING_GOOGLE_MAP_ID_KEY ] = $mapid;
				}

				if ( empty( $current_settings[ \Coco_Gravity_Form_Map_Field\Addon_Coco::SETTING_GOOGLE_MAPS_API_KEY ] )
					|| empty( $current_settings[ \Coco_Gravity_Form_Map_Field\Addon_Coco::SETTING_GOOGLE_MAP_ID_KEY ] ) ) {
					echo '<div class="notice notice-error is-dismissible">';
					echo '<p>Error<br/><br/>.env file should be ready and the vars set up<br/>';
					echo 'GRAVITY_FORMS_GOOGLE_PLACES_API_KEY<br/>GRAVITY_FORMS_GOGLE_MAP_ID</p>';
					echo '</div>';
					echo '<div class="notice notice-warning is-dismissible">';
					echo wp_kses_post( "<p>$message_output</p>" );
					echo '</div>';
					wp_die();
				}

				// Save the updated settings back to the database
				\Coco_Gravity_Form_Map_Field\Addon_Coco::get_instance()->update_plugin_settings( $current_settings );
				$message_output .= 'Gravity Forms for Coco Map Field settings updated.<br>';


				// 3) check if the gravity form is already created
				$form_title = 'Pannelli solari';
				$form       = get_gform_by_title( $form_title, true );

				// if not exists, Import the gravity form in tests/data/gravityforms-form.json
				if ( ! $form ) {
					$message_output .= 'Gravity Form not found, importing from tests/data/gravityforms-form.json<br>';
					$form_json       =  __DIR__ . '/tests/data/gravityforms-form.json';
					$success         = import_gravity_form_from_json( $form_json );
					if ( $success ) {
						$message_output .= 'Gravity Form imported `gravityforms-form.json` successfully.<br>';
						$form            = get_gform_by_title( $form_title, true );
					} else {
						$message_output .= 'Error importing the Gravity Form.<br>';
						wp_die();
					}
				} else {
					$message_output .= 'Found exisiting form ' . $form['id'] . '.<br>';
				}
				$form_id = isset($form['id']) ?  $form['id'] : null;

				if( ! $form_id ) {
					echo '<div class="notice notice-error is-dismissible">';
					echo '<p>Error<br/><br/>Error retrieving the form<br/>';
					echo wp_kses_post( "<p>$message_output</p>" );
					echo '</div>';
					wp_die();
				} else {
					$message_output .= 'Gravity Form ID: ' . esc_html( $form_id ) . '<br>';
				}

				// 4) Create the page with the gravity form in it
				$page_title = 'Pannelli solari';
				// Check if the page already exists
				$page_id = get_page_id_by_title( $page_title );
				if ( ! $page_id ) {
					$page_content = '<!-- wp:gravityforms/form {"formId":"' . $form_id . '","inputPrimaryColor":"#204ce5"} /-->';
					$page = array(
						'post_title'   => $page_title,
						'post_content' => $page_content,
						'post_status'  => 'publish',
						'post_type'    => 'page',
					);
					$page_id = wp_insert_post( $page );
					if ( is_wp_error( $page_id ) ) {
						$message_output .= 'Error creating the page: ' . $page_id->get_error_message() . '<br>';
						wp_die( 'Error creating the page.' );
					} else {
						$message_output .= 'Page created successfully with ID: ' . $page_id . '<br>';
					}
				}

				$message_output .= 'Page with the form: ' . esc_html( $page_id ) . '<br>';

				// Create a button with a link to the page
				$page_url = get_permalink( $page_id );
				if ( $page_url ) {
					$message_output .= '<a href="' . esc_url( $page_url ) . '" id="page-with-form" class="button button-primary" target="_blank">View Page</a><br>';
				}

				echo '<div class="notice notice-success is-dismissible">';
				echo '<p>Plugins and tests have been set up successfully!</p>';
				echo wp_kses_post( "<p>$message_output</p>" );
				echo '</div>';


				// End of process of creation.
			}



			?>
			<div class="wrap">
				<h1>Testing Page</h1>
				<p>This is a testing page for creating dummy data.</p>

				<form method="post" action="">
					<input type="hidden" name="setup_plugins_and_tests" value="1">
					<?php wp_nonce_field( 'setup_plugins_and_tests_action', 'setup_plugins_and_tests_nonce' ); ?>
					<?php submit_button( 'Setup plugins and tests' ); ?>
				</form>
			</div>
			<?php
		}
	);
});



// helper
function get_gform_by_title( $title, $starts_with = false ) {
	$forms = GFAPI::get_forms();

	foreach ( $forms as $form ) {
		if ( isset( $form['title'] ) &&
			( strcasecmp( $form['title'], $title ) === 0 )
			|| ( $starts_with && stripos( $form['title'], $title ) === 0 ) )
	 {
				return $form;
		}
	}

	return null; // No se encontró
}

function import_gravity_form_from_json( $json_path ) {
	if ( ! file_exists( $json_path ) ) {
			return new WP_Error( 'file_not_found', 'The JSON file does not exist.' );
	}

	// Load GFImport class if not already loaded
	if ( ! class_exists( 'GFExport' ) ) {
		require_once( GFCommon::get_base_path() . '/export.php' );
	}

	// Import the form
	return GFExport::import_file( $json_path );
}

function get_page_id_by_title($title) {
	$query = new WP_Query([
			'post_type'      => 'page',
			'posts_per_page' => 1,
			'title'          => $title,
			'post_status'    => 'publish',
	]);

	if (!empty($query->posts)) {
			return $query->posts[0]->ID;
	}

	return null;
}
