<?php
/*
Plugin Name: Base plugin not in use
Plugin URI: http://localhost:8777/wp-admin/options-general.php?page=testing-page
Description: We create this complementary plugin to help on testing (phpunit and e2e). We will create and admin page that helps to create dummy data with one click.
Version: 1.0
Author: cobianzo
Author URI: http://cobianzo.com
License: GPL2
*/


/**
 * All the code in this file is just to create a Settings page
 * for the only use of Playwright.
 * With that page we can create the minimum structure for the testing.
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


			$PAGE_TITLE = 'Pannelli solari';
			$FORM_TITLE = 'Pannelli solari';

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

				// 1.1) Activate the Gravity Forms License with GRAVITY_FORMS_LICENSE_KEY from .env
				// $license_key = isset( $_ENV['GRAVITY_FORMS_LICENSE_KEY'] ) ? sanitize_text_field( $_ENV['GRAVITY_FORMS_LICENSE_KEY'] ) ?? '' : '';
				// if ( ! empty( $license_key ) ) {
				// 	$gf_settings = ...
				// 	if ( empty( $gf_settings['license_key'] ) ) {
				// 		$gf_settings['license_key'] = $license_key;
				// 		update_option( 'rg_gforms_settings', $gf_settings );
				// 		$message_output .= '✅ Gravity Forms license key updated.<br>';
				// 	} else $message_output .= '📔 Gravity Forms license was alread set up.<br>';
				// } else {
				// 	$message_output .= '❌ Gravity Forms Not found.<br>';
				// }




				// 2) setup the values for the gravity forms Google API key  and Map ID, from .env values

				// Retrieve the current settings
				$current_settings = \Coco_Gravity_Form_Map_Field\Addon_Coco::get_instance()->get_plugin_settings();
				if ( ! $current_settings ) {
					$current_settings = array();
				}

				// API key for coco-gravity-form-map-field
				if ( empty( $current_settings[ \Coco_Gravity_Form_Map_Field\Addon_Coco::SETTING_GOOGLE_MAPS_API_KEY ] ) ) {
					$api = isset( $_ENV['GRAVITY_FORMS_GOOGLE_PLACES_API_KEY'] ) ? sanitize_text_field( $_ENV['GRAVITY_FORMS_GOOGLE_PLACES_API_KEY'] ) ?? '' : '';
					$current_settings[ \Coco_Gravity_Form_Map_Field\Addon_Coco::SETTING_GOOGLE_MAPS_API_KEY ] = $api;
				}
				// Map ID field
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

				// API key for solar-project plugin
				$current_API_key_option = get_option( \Coco_Solar\API::GOOGLE_API_KEY_OPTION_NAME );
				if ( ! $current_API_key_option ) {
					$api_key = isset( $_ENV['SOLAR_PROJECT_API_KEY'] ) ? sanitize_text_field( $_ENV['SOLAR_PROJECT_API_KEY'] ) ?? '' : '';
					if ( empty( $api_key ) ) {
						echo '<div class="notice notice-error is-dismissible">';
						echo '<p>Error<br/><br/>.env file should be ready and the vars set up<br/>';
						echo 'SOLAR_PROJECT_API_KEY</p>';
						echo '</div>';
						echo '<div class="notice notice-warning is-dismissible">';
						echo wp_kses_post( "<p>$message_output</p>" );
						echo '</div>';
						wp_die();
					}

					update_option( \Coco_Solar\API::GOOGLE_API_KEY_OPTION_NAME, $api_key );
					$message_output .= '✅ Solar Project API key updated from .env.<br>';
				}

				// Save the updated settings back to the database
				\Coco_Gravity_Form_Map_Field\Addon_Coco::get_instance()->update_plugin_settings( $current_settings );
				$message_output .= 'Gravity Forms for Coco Map Field settings updated.<br>';


				// 3) check if the gravity form is already created
				$form       = get_gform_by_title( $FORM_TITLE, true );

				// if not exists, Import the gravity form in tests/data/gravityforms-form.json
				if ( ! $form ) {
					$message_output .= 'Gravity Form not found, importing from tests/data/gravityforms-form.json<br>';
					$form_json       =  __DIR__ . '/tests/data/gravityforms-form.json';
					$success         = import_gravity_form_from_json( $form_json );
					if ( $success ) {
						$message_output .= 'Gravity Form imported `gravityforms-form.json` successfully.<br>';
						$form            = get_gform_by_title( $FORM_TITLE, true );
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

				// Check if the page already exists
				$page_id = get_page_id_by_title( $PAGE_TITLE );
				if ( ! $page_id ) {
					$page_content = '<!-- wp:gravityforms/form {"formId":"' . $form_id . '","inputPrimaryColor":"#204ce5"} /-->';
					$page = array(
						'post_title'   => $PAGE_TITLE,
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

				// Last setups: Make that page the frontpage
				// Set the page as the front page
				update_option( 'page_on_front', $page_id );
				update_option( 'show_on_front', 'page' );
				$message_output .= 'Page set as the front page.<br>';

				// Set the permalink to postname
				$permalink_structure = get_option( 'permalink_structure' );
				if ( $permalink_structure !== '/%postname%/' ) {
					update_option( 'permalink_structure', '/%postname%/' );
					// Flush rewrite rules to apply the new permalink structure
					flush_rewrite_rules();
					$message_output .= 'Permalink structure set to post name.<br>';
				} else {
					$message_output .= 'Permalink structure already set to post name.<br>';
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


				<?php
				$page_id = get_page_id_by_title( $PAGE_TITLE );
				if ( $page_id ) {

					// check if the page has the block gravityforms/form
					$page_content = get_post_field( 'post_content', $page_id );
					$has_block = has_block( 'gravityforms/form', $page_content );
					// parse the block, and get the formId
					if ( $has_block ) {
						$blocks = parse_blocks( $page_content );
						foreach ( $blocks as $block ) {
							if ( $block['blockName'] === 'gravityforms/form' && ! empty( $block['attrs']['formId'] ) ) {
								$form_id = $block['attrs']['formId'];
								break;
							}
						}
					} else {
						$form_id = null;
					}
					if ( $has_block ) {
						echo '<p>Page with the form found: ' . $form_id . '.</p>';
					} else {
						echo '<p>Page with the form not found.</p>';
					}


					$page_url = get_permalink( $page_id );
					if ( $page_url ) {
						echo '<a href="' . esc_url( $page_url ) . '" id="page-with-form" class="button button-primary" target="_blank">View Page</a><br>';

						echo '<br/>';
						$form_url = "/wp-admin/admin.php?page=gf_edit_forms&id=$form_id";
						echo '<a href="' . esc_url( $form_url ) . '" id="form" class="button button-secondary" target="_blank">View Form</a><br>';
					}
				}
				if (! $page_id ) {
					echo '<p>Page with the form not found.</p>';
				}

				?>
			</div>
			<?php
		}
	);
});



// helpers. Their name speak by itself.


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
