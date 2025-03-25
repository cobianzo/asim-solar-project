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

		// hook for the backend, edit form: adds the option 'Developer' to the Interaction Type
		add_action( 'coco_gf_map_field_interaction_type_extra_options', function () {
			echo '<option value="developer">' . esc_html( 'Developer', 'coco-gravity-forms-map-addon' ) . '</option>';
		} );

		// Gravity_Hooks who applied in the page 2 of the form, on the coco-map field with polygon interaction
		add_action( 'coco_gravity_form_map_field_previous_to_field', array( __CLASS__, 'form_top_message' ), 10, 3 );

		// there is another hook called `coco_gravity_form_map_field_value`
		add_filter( 'coco_gravity_form_map_field_default_zoom', array( __CLASS__, 'set_default_zoom' ), 10, 2 );
		add_filter( 'coco_gravity_form_map_field_default_lat', array( __CLASS__, 'set_default_lat' ), 10, 2 );
		add_filter( 'coco_gravity_form_map_field_default_lng', array( __CLASS__, 'set_default_lng' ), 10, 2 );

		// JS to draw rectangles and polygons and markers: both work but I have deactivated, info not needed.
		// add_action( 'coco_gravity_form_script_after_map_created', [ __CLASS__, 'js_script_to_print_bounding_boxes_areas' ], 10, 3 );

	}

	public static function form_top_message( $field_instance, $form, $value ) {
		$coco_map_entry = Helper::capture_coco_map_field_instance( $form, 'map-roof' );
		if ( empty( $coco_map_entry->value ) ) {
			return;
		}
		echo 'You have selected the roof at : ' . $coco_map_entry->value;
		$previous_marker_value = explode( ',', $coco_map_entry->value );
		$building_data         = \Coco_Solar\Google_Solar_API::get_solar_building_data( $previous_marker_value[0], $previous_marker_value[1] );
		$stats                 = $building_data['solarPotential']['roofSegmentStats'] ?? null;
		echo '<div class="grid-h">';
		if ( $stats ) {
			foreach ( $stats as $i => $segment ) {

				echo '<div class="segment-basic-info" id="segment-basic-info-' . $i . '">';
				echo $i . ' => ' . intval( $segment['azimuthDegrees'] ) . '° / ' . intval( $segment['stats']['areaMeters2'] );
				echo '</div>';

				echo "<div id='segment-info-$i' data-segment='$i' class='segment-info-modal hidden'>";
				echo '<div>';
				echo $i . ' => ' . intval( $segment['azimuthDegrees'] ) . '° / ' . intval( $segment['stats']['areaMeters2'] ) . 'm2';
				echo '<pre style="background-color: white; padding: 10px;">' . wp_json_encode( $segment, JSON_PRETTY_PRINT ) . '</pre>';
				echo '</div>';
				echo '</div>';
			}
		}
		echo '</div>';

		// now the info for debugging for the building profile
		$current_page          = $field_instance->pageNumber;
		$building_profile_data = \Coco_Solar\Google_Maps_API::get_maps_building_data( $previous_marker_value[0], $previous_marker_value[1] );
		$solar_building_data   = \Coco_Solar\Google_Solar_API::get_solar_building_data( $previous_marker_value[0], $previous_marker_value[1] );
		?>
		<button onClick="showBuildingProfile_<?php echo esc_attr( $current_page ); ?>(event); return false;">Mostra profilo di palazzo</button>
		<div id="buildingProfilePopover_<?php echo esc_attr( $current_page ); ?>" class="popup-info hidden" onclick="this.classList.toggle('hidden');">
			<div class="popover-content">
				<pre>
					<?php echo wp_json_encode( $building_profile_data, JSON_PRETTY_PRINT ); ?>
				</pre>
			</div>
		</div>
		<script>
			function showBuildingProfile_<?php echo esc_attr( $current_page ); ?>(e) {
				e.preventDefault();
				const popover = document.getElementById('buildingProfilePopover_<?php echo esc_attr( $current_page ); ?>');
				popover.classList.toggle('hidden')
			}
		</script>


		<button onClick="showSolarAPIReponse_<?php echo esc_attr( $current_page ); ?>(event); return false;">Mostra risposta Solar API</button>
		<div id="buildingSolarResponsePopover_<?php echo esc_attr( $current_page ); ?>" class="popup-info hidden" onclick="this.classList.toggle('hidden');">
			<div class="popover-content">
				<pre>
					<?php echo wp_json_encode( $solar_building_data, JSON_PRETTY_PRINT ); ?>
				</pre>
			</div>
		</div>
		<script>
			function showSolarAPIReponse_<?php echo esc_attr( $current_page ); ?>(e) {
				e.preventDefault();
				const popover = document.getElementById('buildingSolarResponsePopover_<?php echo esc_attr( $current_page ); ?>');
				popover.classList.toggle('hidden')
			}
		</script>

		<button onClick="window.debug.showAllJSGlobalVarsInPopup(event); return false;">Mostra JS variables</button>
		<?php
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

}

Gravity_Hooks::init();
