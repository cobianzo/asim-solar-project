<?php

namespace Coco_Solar;

class Hooks {


	public static function init() {

		add_action( 'wp_enqueue_scripts', array( __CLASS__, 'inject_js_script_step_2_and_3' ) );

		add_action( 'wp_enqueue_scripts', function () {
			$url_style = plugins_url( 'src/style.css', __DIR__ );
			wp_register_style( 'coco-solar-project', $url_style, array(), null );
			wp_enqueue_style( 'coco-solar-project' );
		} );

		// hook for the backend, edit form: adds the option 'developer' to the interaction type
		add_action( 'coco_gf_map_field_interaction_type_extra_options', function () {
			echo '<option value="developer">' . esc_html( 'Developer', 'coco-gravity-forms-map-addon' ) . '</option>';
		} );
		// Hooks who applied in the page 2 of the form, on the coco-map field with polygon interaction
		add_action( 'coco_gravity_form_map_field_previous_to_field', array( __CLASS__, 'form_top_message' ), 10, 3 );

		// add_filter( 'coco_gravity_form_map_field_value', array( __CLASS__, 'set_default_inputvalue' ), 10, 3);
		add_filter( 'coco_gravity_form_map_field_default_zoom', array( __CLASS__, 'set_default_zoom' ), 10, 2 );
		add_filter( 'coco_gravity_form_map_field_default_lat', array( __CLASS__, 'set_default_lat' ), 10, 2 );
		add_filter( 'coco_gravity_form_map_field_default_lng', array( __CLASS__, 'set_default_lng' ), 10, 2 );

		// JS to draw rectangles and polygons and markers: both work but I have deactivated, info not needed.
		// add_action( 'coco_gravity_form_script_after_map_created', [ __CLASS__, 'js_script_to_print_bounding_boxes_areas' ], 10, 3 );

	}

	public static function inject_js_script_step_2_and_3() {
		$form_id = $_POST['gform_submit'] ?? null;

		if ( $form_id ) {

			// grab the already insterted values in the form and expose them to js globals
			$form           = \GFAPI::get_form( $form_id );
			$coco_map_entry = Helper::capture_coco_map_field_value_in_step_1( $form );
			if ( $coco_map_entry ) {
				// step 2 fields
				$coco_segmentrotationtype_instance = Helper::capture_coco_map_field_instance( $form, 'segment-rotation' );
				$coco_mapfieldoffset_instance      = Helper::capture_coco_map_field_instance( $form, 'map-segments-offset' );
				// step 3
				$coco_mapfieldrectangle_instance   = Helper::capture_coco_map_field_instance( $form, 'map-rectangle' );
				// step 4. Not there yet.
				// $coco_mapfieldpanelli_instance     = Helper::capture_coco_map_field_instance( $form, 'map-panelli' );
				// ...
			}

			// we need to be at least in step 2 to expose the js vars
			if ( ! $coco_mapfieldoffset_instance ) {
				return;
			}

			// From here we continue in the ES6 script, loading build/index.js
			$asset_file = include plugin_dir_path( __DIR__ ) . 'build/index.asset.php';
			wp_register_script( 'coco-solar-functions',
				plugins_url( 'build/index.js', __DIR__ ),
				$asset_file['dependencies'],
				$asset_file['version'],
				true
			);

			$previous_marker_value = explode( ',', $coco_map_entry );
			// $data_layers           = \Coco_Solar\Solar_API::get_datalayer_urls( $previous_marker_value[0], $previous_marker_value[1] );
			// previous step data
			wp_add_inline_script( 'coco-solar-functions',
				"window.cocoAssetsDir = '" . \Coco_Solar\Helper::get_icon_url() . "'; \n" .
				"window.step2CocoMapInputId = 'input_{$coco_mapfieldoffset_instance->formId}_{$coco_mapfieldoffset_instance->id}'; \n" .
				"window.step2RotationInserted = " . wp_json_encode( $coco_segmentrotationtype_instance->value ) ." \n" .
				"window.step2OffsetInserted = " . wp_json_encode( $coco_mapfieldoffset_instance->value ) ." \n" . // respect the center of the bounding box

				"window.step3CocoMapInputId = 'input_{$coco_mapfieldrectangle_instance->formId}_{$coco_mapfieldrectangle_instance->id}'; \n" .
				'window.step3RectangleCoords = ' . wp_json_encode( $coco_mapfieldrectangle_instance->value ) . "; \n" .
				"window.gf_current_page = '" . \GFFormDisplay::get_current_page( $form_id ) . "'; \n"
			);

			// new calculated data
			$solar_building_data = \Coco_Solar\Solar_API::get_solar_building_data( $previous_marker_value[0], $previous_marker_value[1] );
			$stats               = $solar_building_data['solarPotential']['roofSegmentStats'] ?? null;
			if ( $stats ) {
				wp_add_inline_script( 'coco-solar-functions',
					'window.cocoBuildingSegments = ' . wp_json_encode( $stats ) . "; \n" .
					'window.cocoOriginalBoundingBox = ' . wp_json_encode( $solar_building_data['boundingBox'] ) . "; \n" .
					'window.cocoOriginalBoundingBoxCenter = ' . wp_json_encode( $solar_building_data['center'] ) . "; \n"
				);
			}

			// building profile data
			$building_profile_data = \Coco_Solar\Solar_API::get_maps_building_data( $previous_marker_value[0], $previous_marker_value[1] );
			if ( isset( $building_profile_data['results'] ) ) {
				$buildings_coords = \Coco_Solar\Solar_API::extract_building_profile_from_map_geocode_response( $building_profile_data );
				wp_add_inline_script( 'coco-solar-functions',
					"window.cocoBuildingProfile = []; \n"
				);
				foreach ( $buildings_coords as $i => $building_coords ) {
					wp_add_inline_script( 'coco-solar-functions',
						'window.cocoBuildingProfile[' . $i . '] = ' . wp_json_encode( $building_coords ) . "; \n"
					);
				}
			}
			// TODELETE:
			// if ( $data_layers ) {
			//  wp_add_inline_script( 'coco-solar-functions',
			//      "window.cocoDataLayers = " . wp_json_encode( $data_layers ) . "; \n"
			//  );
			// }

			$step_map_segments_offset = $step_map_rectangle = $step_map_panelli = null;

			foreach ( $form['fields'] as $field ) {
				if ( 'map-segments-offset' === $field->adminLabel ) {
					$step_map_segments_offset = $field->pageNumber; // 2
				} elseif ( 'map-rectangle' === $field->adminLabel ) {
					$step_map_rectangle = $field->pageNumber; // 3
				}
				// $step_map_panelli = $field->pageNumber; // 4
			}
			$current_page                    = \GFFormDisplay::get_current_page( $form_id );
			$current_page_is_segments_offset = $current_page === $step_map_segments_offset; // step 2
			$current_page_is_rectangle       = $current_page === $step_map_rectangle; // step 2
			$current_page_is_panelli         = $current_page === $step_map_panelli; // step 3

			wp_add_inline_script( 'coco-solar-functions',
				'window.cocoIsStepSelectOffset = ' . wp_json_encode( $current_page_is_segments_offset ) . "; \n" .
				'window.cocoIsStepSelectRectangle = ' . wp_json_encode( $current_page_is_rectangle ) . "; \n" .
				'window.cocoIsStepSelectPanelli = ' . wp_json_encode( $current_page_is_panelli ) . "; \n"
			);
			wp_enqueue_script( 'coco-solar-functions' );

		}
	}

	public static function form_top_message( $field_instance, $form, $value ) {
		$coco_map_entry = Helper::capture_coco_map_field_value_in_step_1( $form );
		if ( ! $coco_map_entry ) {
			return;
		}
		echo 'You have selected the roof at : ' . $coco_map_entry;
		$previous_marker_value = explode( ',', $coco_map_entry );
		$building_data         = \Coco_Solar\Solar_API::get_solar_building_data( $previous_marker_value[0], $previous_marker_value[1] );
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
		$building_profile_data = \Coco_Solar\Solar_API::get_maps_building_data( $previous_marker_value[0], $previous_marker_value[1] );
		$solar_building_data   = \Coco_Solar\Solar_API::get_solar_building_data( $previous_marker_value[0], $previous_marker_value[1] );
		?>
		<p>Clicca qui per mostrare le informazione del palazzo da Google Maps.
			Da qui si disegna il poligono del profilo del palazzo. Cerca i campi <u>buildings</u></p>
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
		<?php
	}


	public static function set_default_inputvalue( $value, $field, $form ) {
		if ( ! empty( $value ) && strlen( $value ) < 3 ) {
			return '';
		}
		if ( 'map-segments-offset' !== $field->adminLabel ) {
			return $value;
		}
		if ( ! empty( $value ) && strlen( $value ) > 3 ) {
			return $value;
		}

		// important: the default value must be the center given by solar API to make calculations work ok.
		$coco_map_entry        = Helper::capture_coco_map_field_value_in_step_1( $form );
		$previous_marker_value = explode( ',', $coco_map_entry );
		$building_data         = \Coco_Solar\Solar_API::get_solar_building_data( $previous_marker_value[0], $previous_marker_value[1] );
		$latlng                = $building_data['center']['latitude'] . ',' . $building_data['center']['longitude'];

		if ( ! empty( $latlng ) ) {
			return $latlng;
		}
		return $value;
	}

	public static function set_default_zoom( $zoom, $form ) {
		$coco_map_entry = Helper::capture_coco_map_field_value_in_step_1( $form );
		if ( $coco_map_entry ) {
			return 20;
		}
		return $zoom;
	}
	public static function set_default_lat( $lat, $form ) { // not in use, set_default_inputvalue is enough
		$coco_map_entry = Helper::capture_coco_map_field_value_in_step_1( $form );
		if ( $coco_map_entry ) {
			$previous_marker_value = explode( ',', $coco_map_entry );
			return $previous_marker_value[0];
		}
		return $lat;
	}

	public static function set_default_lng( $lng, $form ) {
		$coco_map_entry = Helper::capture_coco_map_field_value_in_step_1( $form );
		if ( $coco_map_entry ) {
			$previous_marker_value = explode( ',', $coco_map_entry );
			return $previous_marker_value[1];
		}
		return $lng;
	}


	/**
	 * Called by coco_gravity_form_script_after_map_created
	 *
	 * This code is run once the map is created, and it will use the previous selected marker, if any,
	 * to fetch the building data using the Solar API.
	 *
	 * If the call is successful, it will inject the building data into the map.
	 *
	 * The building data is injected into the map as a global variable, which can be accessed from
	 * the map's `js` property (i.e. `cocoMaps['<?php echo esc_js( $input_id ); ?>'].js`).
	 *
	 * The building data is also logged to the console.
	 *
	 * @param object $instance The instance of the field.
	 * @param array  $form     The form data.
	 * @param string $value    The field value.
	 */
	public static function js_script_to_print_bounding_boxes_areas( $instance, $form, $value ) {
		// We check if the field is the one for polygon.
		$coco_map_entry = Helper::capture_coco_map_field_value_in_step_1( $form );
		if ( ! $coco_map_entry ) {
			return;
		}
		$previous_marker_value = explode( ',', $coco_map_entry );

		$building_data = \Coco_Solar\Solar_API::get_solar_building_data( $previous_marker_value[0], $previous_marker_value[1] );

		if ( ! $building_data || is_wp_error( $building_data ) ) {
			return;
		}

		$sun_marker = Helper::get_icon_url( 'sun-marker.png' );
		$sw_marker  = Helper::get_icon_url( 'vertex-sw.png' );
		$ne_marker  = Helper::get_icon_url( 'vertex-ne.png' );
		$stats      = $building_data['solarPotential']['roofSegmentStats'] ?? null;
		if ( ! $stats ) {
			echo 'alert("No info about that building");';
			echo 'console.log("Error getting $building_data[solarPotential][roofSegmentStats]", '
				. wp_json_encode( $building_data ) . ' );';
			return;
		}
		foreach ( $stats as $i => $segment ) {
			$center       = array(
				'lat' => $segment['center']['latitude'],
				'lng' => $segment['center']['longitude'],
			);
			$sw           = array(
				'lat' => $segment['boundingBox']['sw']['latitude'],
				'lng' => $segment['boundingBox']['sw']['longitude'],
			);
			$ne           = array(
				'lat' => $segment['boundingBox']['ne']['latitude'],
				'lng' => $segment['boundingBox']['ne']['longitude'],
			);
			$bounding_box = $segment['boundingBox'];
			// echo 'console.log("Segment: ", ' . wp_json_encode( $segment ) . ' );';
			// $vertex_as_str = \Coco_Solar\Helper::calculate_bounding_box_tilted(
			//  $bounding_box['sw'],
			//  $bounding_box['ne'],
			//  $segment['center'],
			//  $segment['azimuthDegrees']
			// );
			$vertex_as_str = \Coco_Solar\Helper::get_vertex_by_bounding_box( $bounding_box );
			echo 'console.log("Bounding box: ", ' . wp_json_encode( $segment['azimuthDegrees'] ) . ' );';
			?>
			// paint the square <?php echo esc_js( $i ); ?> of the area given by Sola API
			window.paintAPoygonInMap( map, '<?php echo $vertex_as_str; ?>', { fillColor: '#00FF00', strokeOpacity: 0.9 });
			// paint the icon of the SUN on the center of the bounding box
			window.optionsMarker = {
				scaledSize: new window.google.maps.Size(20, 20),
				anchor: new google.maps.Point(10, 10),
				title: '<?php echo esc_js( $i + 1 ); ?>',
				label: {
					text: '<?php echo esc_js( $i + 1 ); ?>',
					color: "#000000"
				}
			};
			window.paintAMarker( map, <?php echo wp_json_encode( $center ); ?>, '<?php echo esc_url( $sun_marker ); ?>', window.optionsMarker);
			window.paintAMarker( map, <?php echo wp_json_encode( $sw ); ?>, '<?php echo esc_url( $sw_marker ); ?>', { scaledSize: new window.google.maps.Size(10, 10), anchor: new google.maps.Point(0, 10) });
			window.paintAMarker( map, <?php echo wp_json_encode( $ne ); ?>, '<?php echo esc_url( $ne_marker ); ?>', { scaledSize: new window.google.maps.Size(10, 10), anchor: new google.maps.Point(10, 0) });
			<?php
		} // end foreach every segment
		$stats_str = wp_json_encode( $stats );

		// access to the map with cocoMaps['<?php echo esc_js( $input_id ); ?\>'].map
		echo '<!--' .
			$stats_str
		. '-->';
	}
}

Hooks::init();
