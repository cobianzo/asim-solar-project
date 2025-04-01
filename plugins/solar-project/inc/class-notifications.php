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

class Notifications {
  public static function init() {

		add_action( 'rest_api_init', function () {
			// create the new endpoint
			// Usage: 'wp-json/wp/coco-solar/v1/notifications/segmentInfo.html'
      \register_rest_route( 'coco-solar/v1', '/notifications/(?P<notificationName>[a-zA-Z0-9-]+)', array(
        'methods' => 'GET',
        'callback' => [ get_called_class(), 'get_notification_html' ],
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
	 *
	 * @param \WP_REST_Request $request The request containing the notification name.
	*/
  public static function get_notification_html( \WP_REST_Request $request ): \WP_REST_Response | \WP_Error {
    $notification_name = $request->get_param( 'notificationName' );
    $notification_name .= ( substr( $notification_name, -5 ) !== '.html' ) ? '.html' : '';
    $notificationPath = plugin_dir_path( __DIR__ ) . 'assets/notifications/' . $notification_name;
    if ( ! file_exists( $notificationPath ) ) {
      return new \WP_Error( 'not_found', __( 'Notificaiton not found' ), array( 'status' => 404 ) );
    }
    $notificationHtml = file_get_contents( $notificationPath );
    return rest_ensure_response( $notificationHtml );
  }
}

Notifications::init();