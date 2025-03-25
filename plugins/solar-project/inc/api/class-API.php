<?php

namespace Coco_Solar;

/**
 * Generic API calls used either in the
 * Solar API and Google Maps API calls.
 *
 * Also registration of settings fields
 * to asve the Google API key, which needs to
 * be created in the Google Cloud Console
 */
abstract class API {

	const GOOGLE_API_KEY_OPTION_NAME    = 'coco_google_maps_api_key';
	protected static string $base_endpoint;

	public static function init(): void {
		add_action( 'admin_menu', [ __CLASS__, 'add_settings_page' ] );
		add_action( 'admin_init', [ __CLASS__, 'register_settings_fields' ] );
	}

	public static function get_google_api() {
		$key = get_option( self::GOOGLE_API_KEY_OPTION_NAME );;
		// $key = 'AIzaSyB3FE3KIBaI8qOWxZCYuUbYRQDBs61a6v0'; // TODELETE
		return $key;
	}

	/**
	 * Generic call by GET to the Google API
	 *
	 * @param string $method The string to append to the base endpoint
	 * @param array $data
	 * @return mixed
	 */
	public static function get_google_api_response( string $base_endpoint, string $method, array $data = array() ) : array | bool {
		$api_url         = $base_endpoint . $method;
		$transient_key   = '_google_api_' . md5( $api_url . wp_json_encode( $data ) );
		if ( isset( $_GET['solar-cache-clear'] ) ) {
			delete_transient( $transient_key );
		}
		$cached_response = get_transient( $transient_key );

		// debug prints
		// echo '<br><br>API url : ' . $api_url . '<br><br>';
		// echo json_encode( $data, JSON_PRETTY_PRINT );
		// echo '<br>API: ' . self::get_google_api();

		if ( false !== $cached_response ) {
			$cached_response['cached'] = true;
			return $cached_response;
		}

		$data['key'] = self::get_google_api();
		// phpcs:ignore WordPressVIPMinimum.Functions.RestrictedFunctions.wp_remote_get_wp_remote_get
		$response = wp_remote_get( $api_url, array( 'body' => $data ) );

		if ( is_wp_error( $response ) ) {
			return false;
		}

		$response_body    = wp_remote_retrieve_body( $response );
		$decoded_response = json_decode( $response_body, true );

		set_transient( $transient_key, $decoded_response, 5 * DAY_IN_SECONDS );

		return $decoded_response;
	}

	/**
	 * Add a new setting page under settings
	 *
	 * @return void
	 */
	public static function add_settings_page(): void {
		add_options_page(
			__( 'Coco Solar Settings', 'coco-solar' ),
			__( 'Coco Solar', 'coco-solar' ),
			'manage_options',
			'coco_solar_settings',
			[ __CLASS__, 'render_settings_page' ]
		);
	}
	/**
	 * Render the new settings page
	 *
	 * @return void
	 */
	public static function render_settings_page(): void {
		?>
		<div class="wrap">
			<h1><?php esc_html_e( 'Coco Google Maps Settings', 'coco-solar' ); ?></h1>
			<form method="post" action="options.php">
				<?php
				settings_fields( 'coco_solar_settings' );
				do_settings_sections( 'coco_solar_settings' );
				?>
				<?php submit_button(); ?>
			</form>
		</div>
		<?php
	}
	/**
	 * Register the settings fields
	 *
	 * @return void
	 */
	public static function register_settings_fields(): void {
		register_setting(
			'coco_solar_settings',
			self::GOOGLE_API_KEY_OPTION_NAME,
			['sanitize_callback' => 'sanitize_text_field', ]
		);
		add_settings_section(
			'coco_solar_google_section',
			__( 'Google Maps Options', 'coco-solar' ),
			'',
			'coco_solar_settings'
		);
		add_settings_field(
			self::GOOGLE_API_KEY_OPTION_NAME,
			__( 'API Key', 'coco-solar' ),
			static function() {
				printf(
					'<input type="password" value="%s" name="%s" class="regular-text">',
					esc_attr( get_option( self::GOOGLE_API_KEY_OPTION_NAME ) ),
					self::GOOGLE_API_KEY_OPTION_NAME
				);
			},
			'coco_solar_settings',
			'coco_solar_google_section'
		);
	}

}

API::init();

