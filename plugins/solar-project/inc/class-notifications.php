<?php
/**
 * Creates an endpoint to send the notification to js.
 * We create notifications in the folder
 * /assets/notificatoin/myNotification.html
 * and we can load it from js with
 * apiFetch({ path: 'wp-json/wp/coco-solar/v1/notifications/segmentInfo.html' } )
 *
 *
 */
namespace Coco_Solar;

use \Coco_Solar\Helper;

class Notifications {

	public static function init() {

		add_action( 'rest_api_init', function () {
			// create the new endpoint
			// Usage: 'wp-json/wp/coco-solar/v1/notifications/segmentInfo.html'
			\register_rest_route( 'coco-solar/v1', '/notifications/(?P<notificationName>[a-zA-Z0-9-]+)', array(
				'methods'             => 'GET',
				'callback'            => array( get_called_class(), 'get_notification_html' ),
				'permission_callback' => '__return_true',
			) );
		} );
	}

	/**
	 * Retrieves the HTML content of a notification file.
	 *
	 * constructs the file path within the assets/notifications directory.
	 * returns the content of the html file as a response. Otherwise
	 * returns a WP_Error with a 404 status.
	 * Checks if a localized version of the file exists and returns it if found.
	 *
	 * @param \WP_REST_Request $request The request containing the notification name.
	*/
	public static function get_notification_html( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
		$notification_name  = $request->get_param( 'notificationName' );
		$notification_name .= ( substr( $notification_name, -5 ) !== '.html' ) ? '.html' : '';
		// evaluate the possibility of localizing the file
		$localized_path     = plugin_dir_path( __DIR__ ) . 'assets/notifications/'
			. str_replace( '.html', sprintf( '_%s.html', Helper::get_language() ), $notification_name );

		if ( file_exists( $localized_path ) ) {
			$notification_path = $localized_path;
		} else {
			$notification_path = plugin_dir_path( __DIR__ ). 'assets/notifications/'. $notification_name;
		}

		if ( ! file_exists( $notification_path ) ) {
			return new \WP_Error( 'not_found', __( 'Notificaiton not found' ), array( 'status' => 404 ) );
		}
		$notification_html = file_get_contents( $notification_path );
		return rest_ensure_response( $notification_html );
	}
}

Notifications::init();
