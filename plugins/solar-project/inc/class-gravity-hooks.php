<?php
/**
 * Gravity Hooks
 *
 * We use the plugin Addon Coco Gravity Forms Map Field to create the Solar Project experience
 * available at: https://github.com/cobianzo/coco-gravity-forms-map-field
 * The map fields in step 2 and 3 don't set any marker or polygon, so we create a new Interaction Type
 * called 'Developer', and we handle it all with js.
 *
 * The rests of hooks are not very relevant.
 *
 * @package Coco_Solar
 *
 */


namespace Coco_Solar;

class Gravity_Hooks {


	public static function init() {

		// to inject html code before the form is rendered
		add_filter( 'gform_get_form_filter', array( __CLASS__, 'form_top_message' ), 10, 2 );

		// backend fr coco-map-field plugin, edit form: adds the option 'Developer' to the Interaction Type
		add_action( 'coco_gf_map_field_interaction_type_extra_options', function () {
			echo '<option value="developer">' . esc_html( 'Developer', 'coco-gravity-forms-map-addon' ) . '</option>';
		} );

		// there is another hook called `coco_gravity_form_map_field_value`
		// Step 2. Set the coords in the field selected in step 1.
		add_filter( 'coco_gravity_form_map_field_default_zoom', array( __CLASS__, 'set_default_zoom' ), 10, 2 );
		add_filter( 'coco_gravity_form_map_field_default_lat', array( __CLASS__, 'set_default_lat' ), 10, 2 );
		add_filter( 'coco_gravity_form_map_field_default_lng', array( __CLASS__, 'set_default_lng' ), 10, 2 );

		// Step 2, custom HTML there in combination with step4·functions.ts
		add_filter( 'gform_field_content', array( __CLASS__, 'step2_show_message_if_error' ), 10, 5 );
		add_filter('gform_next_button', array( __CLASS__, 'step2_hide_next_btn_if_error' ), 10, 2 );


		// Step 4, custom HTML there in combination with step4·functions.ts
		add_filter( 'gform_field_content', array( __CLASS__, 'step4_power_calculations_html' ), 10, 5 );
	}

	public static function form_top_message( $form, $form_id ) {
		?>
		<div class="popup-info hidden" id="popup-generic"
			onclick="window.closeNotificationPopup(); return false ">
			<div class="popup-generic-content"></div>
		</div>
		<?php
		return $form;
	}

	public static function set_default_zoom( $zoom, $form ) {
		$coco_map_field = Helper::capture_coco_map_field_instance( $form, 'map-roof' );
		return ! empty( $coco_map_field->value ) ? 20 : $zoom;
	}
	public static function set_default_lat( $lat, $form ) {
		$coco_map_field = Helper::capture_coco_map_field_instance( $form, 'map-roof' );
		if ( ! empty( $coco_map_field->value ) ) {
			$previous_marker_value = explode( ',', $coco_map_field->value );
			return $previous_marker_value[0];
		}
		return $lat;
	}

	public static function set_default_lng( $lng, $form ) {
		$coco_map_field = Helper::capture_coco_map_field_instance( $form, 'map-roof' );
		if ( ! empty( $coco_map_field->value ) ) {
			$previous_marker_value = explode( ',', $coco_map_field->value );
			return $previous_marker_value[1];
		}
		return $lng;
	}

	public static function step2_show_message_if_error( $field_content, $field, $value, $lead_id, $form_id ) {
		if ( $field->adminLabel === 'map-segments-offset' ) {
			$solar_building_data = Helper::get_solar_api_data_from_step_1_value( $form_id );

			if ( ! empty( $solar_building_data['error']['message'] ) ) {
				$field_content = '<div class="gf_error_message">'
					. esc_html( $solar_building_data['error']['message'] ) . '<br />'
					. '<p><br />' . __( 'Please use the "Previous" button and select another roof', 'solar-panel' ) . '</p>'
					. '</div>';
				return $field_content;
			}
		}
		if ( $field->adminLabel === 'segment-rotation' ) {
			$solar_building_data = Helper::get_solar_api_data_from_step_1_value( $form_id );
			if ( ! empty( $solar_building_data['error']['message'] ) ) {
				return '';
			}
		}
		return $field_content;
	}

	public static function step2_hide_next_btn_if_error( $button, $form ) {
		$solar_building_data = Helper::get_solar_api_data_from_step_1_value( $form['id'] );
		if ( ! empty( $solar_building_data['error']['message'] ) ) {
			// return '';
		}
		return $button;

	}
	public static function step4_power_calculations_html( $field_content, $field, $value, $lead_id, $form_id ) {
		if ( $field->adminLabel === 'power-calculations' ) {
			if ( $field->pageNumber !== \GFFormDisplay::get_current_page( $form_id ) ) {
				return $field_content;
			}
			ob_start();
				include 'render-step-4.php';
			$new_content = ob_get_clean();
			$html_before = '';
			$html_after  = '';
			return $html_before . $new_content . $field_content . $html_after;
		}

		return $field_content;
	}



}

Gravity_Hooks::init();
