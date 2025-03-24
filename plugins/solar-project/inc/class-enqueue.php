<?php

namespace Coco_Solar;


class Enqueue {

	public static function init() {

		// Javascript
		add_action( 'wp_enqueue_scripts', array( __CLASS__, 'inject_js_script_step_1_2_and_3' ) );

		// Styles
		add_action( 'wp_enqueue_scripts', function () {
			wp_register_style( 'coco-solar-project', plugins_url( 'src/style.css', __DIR__ ), [], null );
			wp_enqueue_style( 'coco-solar-project' );
		} );
	}

	/**
	 * Enqueue the coco-solar-functions script which injects the previously inserted data from the form fields into window globals.
	 * This script is loaded in the footer and will start the CocoSolar app.
	 *
	 * The data that is injected into window globals are:
	 * - step1CocoMapInputId: the id of the input field where the user selected the roof in step 1
	 * - step2CocoMapInputId: the id of the input field where the user inserted the segments offset in step 2
	 * - step2RotationInserted: the value inserted in the segments rotation field in step 2
	 * - step2OffsetInserted: the value inserted in the segments offset field in step 2
	 * - step3CocoMapInputId: the id of the input field where the user inserted the rectangle in step 3
	 * - step3Rectangles: the rectangles inserted in step 3
	 * - gf_current_page: the current page of the form
	 * - cocoBuildingSegments: the segments of the building from the solarPotential API
	 * - cocoOriginalBoundingBox: the original bounding box of the building from the solarPotential API
	 * - cocoOriginalBoundingBoxCenter: the original center of the building from the solarPotential API
	 * - cocoBuildingProfile: the profile of the building from the Google Maps API
	 * - cocoIsStepSelectRoof: if the current page is the one where the user selects the roof
	 * - cocoIsStepSelectOffset: if the current page is the one where the user inserts the segments offset
	 * - cocoIsStepSelectRectangle: if the current page is the one where the user inserts the rectangle
	 */
	public static function inject_js_script_step_1_2_and_3() {
		$form_id = $_POST['gform_submit'] ?? Helper::get_gravity_form_id_from_page();
		if ( $form_id ) {

			// grab the already insterted values in the form and expose them to js globals
			$form           = \GFAPI::get_form( $form_id );

			// step 1 fields
			$coco_maproofselect_instance = Helper::capture_coco_map_field_instance( $form, 'map-roof' );
			$coco_map_entry = $coco_maproofselect_instance->value;

			// step 2 fields
			$coco_segmentrotationtype_instance = Helper::capture_coco_map_field_instance( $form, 'segment-rotation' );
			$coco_mapfieldoffset_instance      = Helper::capture_coco_map_field_instance( $form, 'map-segments-offset' );
			// step 3
			$coco_mapfieldrectangle_instance   = Helper::capture_coco_map_field_instance( $form, 'map-rectangle' );
			$coco_savedrectangles_instance     = Helper::capture_coco_map_field_instance( $form, 'saved-rectangles' );
			// step 4. Not there yet.
			// ...


			// From here we continue in the ES6 script, loading build/index.js
			$asset_file = include plugin_dir_path( __DIR__ ) . 'build/index.asset.php';
			wp_register_script( 'coco-solar-functions',
				plugins_url( 'build/index.js', __DIR__ ),
				$asset_file['dependencies'],
				$asset_file['version'],
				true
			);

			// $data_layers           = \Coco_Solar\Google_Solar_API::get_datalayer_urls( $previous_marker_value[0], $previous_marker_value[1] );
			// previous step data
			wp_add_inline_script( 'coco-solar-functions',
				"window.cocoAssetsDir = '" . \Coco_Solar\Helper::get_icon_url() . "'; \n" .
				// step 1
				"window.step1CocoMapInputId = 'input_{$coco_maproofselect_instance->formId}_{$coco_maproofselect_instance->id}'; \n" .
				// step 2
				"window.step2CocoMapInputId = 'input_{$coco_mapfieldoffset_instance->formId}_{$coco_mapfieldoffset_instance->id}'; \n" .
				"window.step2RotationInserted = " . wp_json_encode( $coco_segmentrotationtype_instance->value ) ." \n" .
				"window.step2OffsetInserted = " . wp_json_encode( $coco_mapfieldoffset_instance->value ) ." \n" . // respect the center of the bounding box
				// step 3
				"window.step3CocoMapInputId = 'input_{$coco_mapfieldrectangle_instance->formId}_{$coco_mapfieldrectangle_instance->id}'; \n" .
				// 'window.step3RectangleCoords = ' . wp_json_encode( $coco_mapfieldrectangle_instance->value ) . "; \n" .
				"window.step3Rectangles = " . wp_json_encode( $coco_savedrectangles_instance->value ) ." \n" .
				// gravity forms related
				"window.gf_current_page = '" . \GFFormDisplay::get_current_page( $form_id ) . "'; \n"
			);

			if ( $coco_map_entry ) {


				$previous_marker_value = explode( ',', $coco_map_entry );
				// new calculated data
				$solar_building_data = \Coco_Solar\Google_Solar_API::get_solar_building_data( $previous_marker_value[0], $previous_marker_value[1] );
				$stats               = $solar_building_data['solarPotential']['roofSegmentStats'] ?? null;
				if ( $stats ) {

					// We add more data to the segments as we'll use it in the js side.
					$stats = array_map( fn($segment_data) => array_merge(
						$segment_data,
						array('originalCoords' => [
							'originalBoundingBox' => $segment_data['boundingBox'],
							'originalCenter'      => $segment_data['center'],
						])
					), $stats );

					wp_add_inline_script( 'coco-solar-functions',
						'window.cocoBuildingSegments = ' . wp_json_encode( $stats ) . "; \n" .
						'window.cocoOriginalBoundingBox = ' . wp_json_encode( $solar_building_data['boundingBox'] ) . "; \n" .
						'window.cocoOriginalBoundingBoxCenter = ' . wp_json_encode( $solar_building_data['center'] ) . "; \n"
					);
				}

				// building profile data
				$building_profile_data = \Coco_Solar\Google_Maps_API::get_maps_building_data( $previous_marker_value[0], $previous_marker_value[1] );
				if ( isset( $building_profile_data['results'] ) ) {
					$buildings_coords = \Coco_Solar\Google_Maps_API::extract_building_profile_from_map_geocode_response( $building_profile_data );
					wp_add_inline_script( 'coco-solar-functions',
						"window.cocoBuildingProfile = []; \n"
					);
					foreach ( $buildings_coords as $i => $building_coords ) {
						wp_add_inline_script( 'coco-solar-functions',
							'window.cocoBuildingProfile[' . $i . '] = ' . wp_json_encode( $building_coords ) . "; \n"
						);
					}
				}
			}
			// TODELETE:
			// if ( $data_layers ) {
			//  wp_add_inline_script( 'coco-solar-functions',
			//      "window.cocoDataLayers = " . wp_json_encode( $data_layers ) . "; \n"
			//  );
			// }

			$step_map_roof = $step_map_segments_offset = $step_map_rectangle = null;

			foreach ( $form['fields'] as $field ) {
				if ( 'map-roof' === $field->adminLabel ) {
					$step_map_roof = $field->pageNumber; // 1
				} elseif ( 'map-segments-offset' === $field->adminLabel ) {
					$step_map_segments_offset = $field->pageNumber; // 2
				} elseif ( 'map-rectangle' === $field->adminLabel ) {
					$step_map_rectangle = $field->pageNumber; // 3
				}
				// $step_map_panelli = $field->pageNumber; // 4
			}
			$current_page                    = \GFFormDisplay::get_current_page( $form_id );
			$current_page_is_select_marker   = $current_page === $step_map_roof; // step 1
			$current_page_is_segments_offset = $current_page === $step_map_segments_offset; // step 2
			$current_page_is_rectangle       = $current_page === $step_map_rectangle; // step 3
			// $current_page_is_panelli         = $current_page === $step_map_panelli; // step 3

			wp_add_inline_script( 'coco-solar-functions',
				'window.cocoIsStepSelectRoof = ' . wp_json_encode( $current_page_is_select_marker ) . "; \n" . // step 1
				'window.cocoIsStepSelectOffset = ' . wp_json_encode( $current_page_is_segments_offset ) . "; \n" . // step 2
				'window.cocoIsStepSelectRectangle = ' . wp_json_encode( $current_page_is_rectangle ) . "; \n" // step 3
				// 'window.cocoIsStepSelectPanelli = ' . wp_json_encode( $current_page_is_panelli ) . "; \n"
			);
			wp_enqueue_script( 'coco-solar-functions' );

		}
	}

}

Enqueue::init();