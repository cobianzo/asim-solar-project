<?php

namespace Coco_Solar;

class Helper {

	public static function capture_coco_map_field_instance( $form, $adminLabel ) {
		$entry = \GFFormsModel::get_current_lead(); // get all data already inputted in the form

		// we detect the coco-form which is hidden now because we are not in the page 1.
		foreach ( $form['fields'] as $field ) {
			if (
				! rgar( $field, 'isHidden' ) && $adminLabel === $field->adminLabel
			) {
				$field->value = $entry[ $field->id ] ?? null;
				return $field;
			}
		}

		return null;
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
            if ( $block['blockName'] === 'gravityforms/form' && !empty($block['attrs']['formId']) ) {
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
