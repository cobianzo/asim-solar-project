<?php


/**
 *
 */


class Model_Panel {

	public static function init() {
		add_action( 'init', array( __CLASS__, 'register_solar_panel_model_cpt' ) );

		add_action( 'add_meta_boxes', array( __CLASS__, 'add_meta_box' ) );
		add_action( 'save_post', array( __CLASS__, 'save_custom_fields' ) );

		// Rest API related
		// Usage: apiFetch({ path: `/wp/v2/panel/${postId}` })
		// E.g. http://localhost:8777/wp-json/wp/v2/panel/13
		add_action( 'rest_api_init', array( __CLASS__, 'register_panel_custom_fields' ) );
	}

	public static function register_solar_panel_model_cpt() {

		$labels = array(
			'name'               => _x( 'Solar Panel Models', 'post type general name', 'textdomain' ),
			'singular_name'      => _x( 'Solar Panel Model', 'post type singular name', 'textdomain' ),
			'menu_name'          => _x( 'Solar Panel Models', 'admin menu', 'textdomain' ),
			'name_admin_bar'     => _x( 'Solar Panel Model', 'add new on admin bar', 'textdomain' ),
			'add_new'            => _x( 'Add New', 'solar panel model', 'textdomain' ),
			'add_new_item'       => __( 'Add New Solar Panel Model', 'textdomain' ),
			'new_item'           => __( 'New Solar Panel Model', 'textdomain' ),
			'edit_item'          => __( 'Edit Solar Panel Model', 'textdomain' ),
			'view_item'          => __( 'View Solar Panel Model', 'textdomain' ),
			'all_items'          => __( 'All Solar Panel Models', 'textdomain' ),
			'search_items'       => __( 'Search Solar Panel Models', 'textdomain' ),
			'parent_item_colon'  => __( 'Parent Solar Panel Models:', 'textdomain' ),
			'not_found'          => __( 'No solar panel models found.', 'textdomain' ),
			'not_found_in_trash' => __( 'No solar panel models found in Trash.', 'textdomain' ),
		);

		$args = array(
			'labels'             => $labels,
			'public'             => true,
			'show_in_rest'       => true,
			'publicly_queryable' => true,
			'show_ui'            => true,
			'show_in_menu'       => true,
			'query_var'          => true,
			'rewrite'            => array( 'slug' => 'solar-panel-model' ),
			'capability_type'    => 'post',
			'has_archive'        => true,
			'hierarchical'       => false,
			'menu_position'      => null,
			'supports'           => array( 'title' ),
		);

		register_post_type( 'panel', $args );
	}

	public static function add_meta_box() {
		add_meta_box(
			'custom_fields_box',
			__( 'Specifications' ),
			array( __CLASS__, 'render_meta_box' ),
			'panel',
			'normal',
			'high'
		);
	}

	public static function render_meta_box( $post ) {
		$length        = get_post_meta( $post->ID, 'length', true ) ?? '1.5';
		$height        = get_post_meta( $post->ID, 'height', true ) ?? '1';
		$nominal_power = get_post_meta( $post->ID, 'nominal_power', true ) ?? '400';
		$length        = $length ? $length : '1.5';
		$height        = $height ? $height : '1';
		$nominal_power = $nominal_power ? $nominal_power : '400';

		wp_nonce_field( basename( __FILE__ ), 'custom_fields_nonce' );
		?>
		<p>
				<label for="length">Length (m):</label>
				<input type="number" step="0.001" name="length" value="<?php echo esc_attr( $length ); ?>" />
		</p>
		<p>
				<label for="height">Height (m):</label>
				<input type="number" step="0.001" name="height" value="<?php echo esc_attr( $height ); ?>" />
		</p>
		<p>
				<label for="nominal_power">Nominal Power (W):</label>
				<input type="number" step="1" name="nominal_power" value="<?php echo esc_attr( $nominal_power ); ?>" />
		</p>
		<?php
	}

	public static function save_custom_fields( $post_id ) {
		if ( ! isset( $_POST['custom_fields_nonce'] ) || ! wp_verify_nonce( $_POST['custom_fields_nonce'], basename( __FILE__ ) ) ) {
				return;
		}
		if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
				return;
		}
		if ( ! current_user_can( 'edit_post', $post_id ) ) {
				return;
		}

		$fields = array( 'length', 'height', 'nominal_power' );

		foreach ( $fields as $field ) {
			if ( isset( $_POST[ $field ] ) ) {
					update_post_meta( $post_id, $field, sanitize_text_field( $_POST[ $field ] ) );
			} else {
					delete_post_meta( $post_id, $field );
			}
		}
	}

	public static function register_panel_custom_fields() {
		register_rest_field(
			'panel', // Slug del CPT
			'custom_fields', // Clave en la respuesta de la API
			array(
				'get_callback'    => array( __CLASS__, 'get_panel_custom_fields' ),
				'update_callback' => null,
				'schema'          => null,
			)
		);
	}

	public static function get_panel_custom_fields( $object ) {
		return array(
			'length'        => get_post_meta( $object['id'], 'length', true ) ?: '1.5',
			'height'        => get_post_meta( $object['id'], 'height', true ) ?: '1',
			'nominal_power' => get_post_meta( $object['id'], 'nominal_power', true ) ?: '400',
		);
	}

	public static function calculate_power_energy( $values = [
		'number_panels' => 0,
		'panel_power' => 0,
		'hours_sun' => 0,
		'final_efficiency' => 0,
	] ) {
		$roof_energy = $values['number_panels']
			* $values['panel_power']
			* $values['hours_sun']
			* $values['final_efficiency'];

		return $roof_energy;
	}
}

Model_Panel::init();
