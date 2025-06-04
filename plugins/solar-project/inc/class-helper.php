<?php

namespace Coco_Solar;

class Helper {



	/**
	 * Captures a map field instance from a Gravity Form based on its admin label
	 *
	 * @param array  $form       The Gravity Form array containing all form fields and settings
	 * @param string $adminLabel The admin label to identify the specific map field
	 *
	 * @return object|null Returns the field object if found, null otherwise
	 */
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


	/**
	 * Retrieves solar API data based on coordinates from step 1 of the form
	 *
	 * @param int $form_id The ID of the Gravity Form to get data from
	 *
	 * @return array|null Solar building data if coordinates are found, null otherwise
	 */
	public static function get_solar_api_data_from_step_1_value( $form_id ) {
		$form = \GFAPI::get_form( $form_id );

		// step 1 map field
		$coco_maproofselect_instance = self::capture_coco_map_field_instance( $form, 'map-roof' );
		$coco_map_entry              = $coco_maproofselect_instance->value;
		if ( ! $coco_map_entry ) {
			return null;
		}
		$step_1_coords       = explode( ',', $coco_map_entry );
		$solar_building_data = \Coco_Solar\Google_Solar_API::get_solar_building_data( $step_1_coords[0], $step_1_coords[1] );
		return $solar_building_data;
	}

	/**
	 * Checks if the current page of a multi-page form matches the page number
	 * of a specific field, given by the adminLabel (it's set when editing the form)
	 *
	 * @param int    $form_id    The ID of the Gravity Form to check
	 * @param string $adminLabel The admin label of the field to check (optional)
	 *
	 * @return bool Returns true if current page matches the field's page number, false otherwise
	 */
	public static function is_page_of_field( $form_id, $adminLabel = null ) {
		$current_page = \GFFormDisplay::get_current_page( $form_id );
		$form         = \GFAPI::get_form( $form_id );
		$page_field   = null;
		foreach ( $form['fields'] as $field ) {
			if ( $adminLabel === $field->adminLabel ) {
				$page_field = $field->pageNumber;
				break;
			}
		}
		return $page_field === $current_page;
	}



	/**
	 * Retrieves the URL inside the subfolder /assets of an icon file.
	 *
	 * @param string $icon_file The icon file name.
	 * @return void
	 */
	public static function get_icon_url( $icon_file = '' ) {
		$sun_marker = plugin_dir_url( __DIR__ ) . "assets/$icon_file";
		// when using browser sync it returns a weird url, so we send it relative not absolute
		$sun_marker = str_replace( get_option( 'siteurl' ), '', $sun_marker );
		return $sun_marker;
	}

	/**
	 * Gets the Gravity Form ID from a page's content by looking for the gravityforms/form block
	 *
	 * @param int|null $post_id Optional. The post ID to check. Defaults to current post ID.
	 * @return int|false The Gravity Form ID if found, false otherwise
	 */
	public static function get_gravity_form_id_from_page( $post_id = null ):	int|false {
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

	/**
	 * If we are in italian, return 'it'
	 *
	 * @return string
	 */
	public static function get_language() {
		$locale = get_locale();
		return substr( $locale, 0, 2 );
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
