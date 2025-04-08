<?php

namespace Coco_Solar;

class Helper {

	public static function capture_coco_map_field_instance( $form, $adminLabel ) {
		$entry = \GFFormsModel::get_current_lead(); // get all data already inputted in the form

		// Evaluate the case of visiting the form with Save and Continue
		$token = $_GET['gf_token'] ?? null;
		if ( $token ) {
			$draft          = \GFFormsModel::get_draft_submission_values( $token );
			$form_data      = json_decode( $draft['submission'], true );
			$submitted_data = $form_data['submitted_values'] ?? null;
		}


		// we detect the coco-form which is hidden now because we are not in the page 1.
		foreach ( $form['fields'] as $field ) {
			if (
				! rgar( $field, 'isHidden' ) && $adminLabel === $field->adminLabel
			) {
				$field->value = $entry[ $field->id ] ?? null;

				if ( null === $field->value && isset( $submitted_data[ $field->id ] ) ) {
					$field->value = $submitted_data[ $field->id ];
				}

				return $field;
			}
		}

		return null;
	}

	// a more elaborated data retrieve from inserted values in the step 1
	public static function get_solar_api_data_from_step_1_value( $form_id ) {
		$form = \GFAPI::get_form( $form_id );

		// step 1 fields
		$coco_maproofselect_instance = Helper::capture_coco_map_field_instance( $form, 'map-roof' );
		$coco_map_entry              = $coco_maproofselect_instance->value;
		if ( ! $coco_map_entry ) {
			return null;
		}
		$step_1_coords = explode( ',', $coco_map_entry );
		$solar_building_data = \Coco_Solar\Google_Solar_API::get_solar_building_data( $step_1_coords[0], $step_1_coords[1] );
		return $solar_building_data;
	}

	public static function get_icon_url( $icon_file = '' ) {
		$sun_marker = plugin_dir_url( __DIR__ ) . "assets/$icon_file";
		// when using browser sync it returns a weird url, so we send it relative not absolute
		$sun_marker = str_replace( get_option( 'siteurl' ), '', $sun_marker );
		return $sun_marker;
	}

	public static function get_gravity_form_id_from_page( $post_id = null ) {
		$post_id = $post_id ?? get_the_ID();
		$content = get_post_field( 'post_content', $post_id );

		if ( has_block( 'gravityforms/form', $content ) ) {
			// Extract form ID from the block
			$blocks = parse_blocks( $content );
			foreach ( $blocks as $block ) {
				if ( $block['blockName'] === 'gravityforms/form' && ! empty( $block['attrs']['formId'] ) ) {
					return $block['attrs']['formId'];
				}
			}
		}

		return false; // No Gravity Forms block found
	}

	public static function dd( $var ) {
		echo '<pre>';
		print_r( $var );
		echo '</pre>';
	}
	public static function ddie( $var ) {
		dd( $var );
		wp_die( 'mueto' );
	}
}

function dd( $var ) {
	echo '<pre>';
	print_r( $var );
	echo '</pre>';
}
function ddie( $var ) {
	dd( $var );
	wp_die( 'mueto' );
}
