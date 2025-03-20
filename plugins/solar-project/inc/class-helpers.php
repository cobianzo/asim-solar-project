<?php

namespace Coco_Solar;

class Helper {


	/**
	 * Undocumented function TODO: we can use now capture_coco_map_field_instance($form, 'map-roof') and the ->lcg_value
	 * TODELETE
	 *
	 * @param array $form
	 * @return ?string
	 */
	public static function capture_coco_map_field_value_in_step_1( $form ) {
		$entry = \GFFormsModel::get_current_lead(); // get all data already inputted in the form
		if ( $entry ) {
			// we detect the first coco-form, where we captured the coordinates
			foreach ( $form['fields'] as $field ) {
				if (
					! rgar( $field, 'isHidden' ) && ! empty( $entry[ $field->id ] )
					&& 'coco-map' === rgar( $field, 'type' )
				) {
					return $entry[ $field->id ];
				}
			}
		}
		return null;
	}

	// not in use, not tested.
	public static function capture_coco_map_field_instances_in_page( $form ) {
		$page_number = \GFFormDisplay::get_current_page( $form['id'] );

		$coco_map_fields_in_page = array();
		foreach ( $form['fields'] as $field ) {
			if ( 'coco-map' === rgar( $field, 'type' ) &&
				( $field->pageNumber === $page_number ) ) {
				$coco_map_fields_in_page[] = $field;
			}
		}
		return $coco_map_fields_in_page;
	}

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
	/**
	 * "boundingBox": {
			"sw": {
			"latitude": 47.2506032,
			"longitude": -1.5593747999999998
			},
			"ne": {
			"latitude": 47.2508549,
			"longitude": -1.5588792999999999
			}
		},
	 *
	 * @param array $bounding_box_object
	 * @return void
	 */
	public static function get_vertex_by_bounding_box( $bounding_box_object ) {
		$v1 = $bounding_box_object['sw']['latitude'] . ',' . $bounding_box_object['sw']['longitude'];
		$v2 = $bounding_box_object['sw']['latitude'] . ',' . $bounding_box_object['ne']['longitude'];
		$v3 = $bounding_box_object['ne']['latitude'] . ',' . $bounding_box_object['ne']['longitude'];
		$v4 = $bounding_box_object['ne']['latitude'] . ',' . $bounding_box_object['sw']['longitude'];

		$vertex_as_array = array( $v1, $v2, $v3, $v4 );
		return implode( ' ', $vertex_as_array );
	}

	public static function get_icon_url( $icon_file = '' ) {
		$sun_marker = plugin_dir_url( __DIR__ ) . "assets/$icon_file";
		// when using browser sync it returns a weird url, so we send it relative not absolute
		$sun_marker = str_replace( get_option( 'siteurl' ), '', $sun_marker );
		return $sun_marker;
	}

	public static function toRadians( $degrees ) {
		return $degrees * ( M_PI / 180 );
	}

	public static function toDegrees( $radians ) {
			return $radians * ( 180 / M_PI );
	}

	public static function distance_between_latitudes( $lat1, $lat2 ) {
		$earth_radius_km = 6371; // Radio de la Tierra en km
		$distance        = abs( $lat2 - $lat1 ) * ( M_PI / 180 ) * $earth_radius_km;
		return $distance;
	}

	public static function distance_between_longitudes( $lng1, $lng2, $latitude ) {
			$earth_radius_km = 6371; // Radio de la Tierra en km
			$latitude_rad    = deg2rad( $latitude ); // Convertir latitud a radianes
			$distance        = abs( $lng2 - $lng1 ) * cos( $latitude_rad ) * ( M_PI / 180 ) * $earth_radius_km;
			return $distance;
	}

	public static function calculate_angle( $cat_opuesto, $cat_adyacente ) {
		$angulo_rad = atan2( $cat_opuesto, $cat_adyacente ); // Calcula el ángulo en radianes
		$angulo_deg = rad2deg( $angulo_rad ); // Convierte a grados
		return $angulo_deg;
	}


	public static function calcular_vertices( $x1, $y1, $x2, $y2, $alpha ) {
		$width  = abs( $x2 - $x1 );
		$height = abs( $y2 - $y1 );

		$rad = deg2rad( $alpha ); // Convertir ángulo a radianes

		// Dirección en la dirección del ancho
		$dx_w = cos( $rad ) * $width;
		$dy_w = sin( $rad ) * $width;

		// Dirección en la dirección de la altura
		$dx_h = -sin( $rad ) * $height;
		$dy_h = cos( $rad ) * $height;

		// Calcular los otros dos puntos
		$x3 = $x1 + $dx_w;
		$y3 = $y1 + $dy_w;

		$x4 = $x3 + $dx_h;
		$y4 = $y3 + $dy_h;

		return array(
			array(
				'x' => $x1,
				'y' => $y1,
			),
			array(
				'x' => $x3,
				'y' => $y3,
			),
			array(
				'x' => $x2,
				'y' => $y2,
			),
			array(
				'x' => $x4,
				'y' => $y4,
			),
		);
	}

	private static function haversine_distance( $lat1, $lon1, $lat2, $lon2 ) {
		$earth_radius = 6371000; // radio de la Tierra en metros

		$dLat = deg2rad( $lat2 - $lat1 );
		$dLon = deg2rad( $lon2 - $lon1 );

		$a = sin( $dLat / 2 ) * sin( $dLat / 2 ) +
				cos( deg2rad( $lat1 ) ) * cos( deg2rad( $lat2 ) ) *
				sin( $dLon / 2 ) * sin( $dLon / 2 );
		$c = 2 * atan2( sqrt( $a ), sqrt( 1 - $a ) );

		return $earth_radius * $c; // distancia en metros
	}

	public static function calculate_bounding_box_tilted( $sw, $ne, $center, $azimuthDegrees ) {
		list($lat1, $lon1)           = array( $sw['latitude'], $sw['longitude'] );
		list($lat2, $lon2)           = array( $ne['latitude'], $ne['longitude'] );
		list($centerLat, $centerLon) = array( $center['latitude'], $center['longitude'] );
		$azimuthDegrees              = 300;
		$azimuthRadians              = deg2rad( $azimuthDegrees );

		$halfWidth  = self::haversine_distance( $lat1, $lon1, $lat1, $lon2 ) / 2;
		$halfHeight = self::haversine_distance( $lat1, $lon1, $lat2, $lon1 ) / 2;

		$vertices = array(
			array( $lat1, $lon1 ), // SW
			array(
				$centerLat + $halfHeight * sin( $azimuthRadians ),
				$centerLon - ( $halfWidth / cos( deg2rad( $centerLat ) ) ) * cos( $azimuthRadians ),
			), // NW
			array( $lat2, $lon2 ), // NE
			array(
				$centerLat - $halfHeight * sin( $azimuthRadians ),
				$centerLon + ( $halfWidth / cos( deg2rad( $centerLat ) ) ) * cos( $azimuthRadians ),
			),  // SE
		);

		$result = array();
		foreach ( $vertices as $vertex ) {
				$result[] = implode( ',', $vertex );
		}

		return implode( ' ', $result );
	}



	/**
	 * NOT working: returning error division by 0! @TODO: Try create the algorth w/ Claude
	 * Expands a polygon by a given outline, by shifting the points of the
	 * polygon outwards by the given outline.
	 *
	 * @param string $polygon The original polygon as a string of space-separated
	 *                         vertex coordinates (e.g. "x1,y1 x2,y2 ...").
	 * @param float  $outline The outline to expand the polygon by.
	 *
	 * @return string The expanded polygon as a string of space-separated vertex
	 *                coordinates.
	 */
	public static function expand_polygon( string $polygon, float $outline ) {
		$points = array_map(
			function ( $point ) {
				return array_map( 'floatval', explode( ',', $point ) );
			},
			explode( ' ', $polygon )
		);

		$expandedPoints = array();
		$count          = count( $points );

		for ( $i = 0; $i < $count; $i++ ) {
			$prev = $points[ ( $i - 1 + $count ) % $count ];
			$curr = $points[ $i ];
			$next = $points[ ( $i + 1 ) % $count ];

			// Vector entre los puntos anterior y actual
			$vx1 = $curr[0] - $prev[0];
			$vy1 = $curr[1] - $prev[1];

			// Vector entre los puntos actual y siguiente
			$vx2 = $next[0] - $curr[0];
			$vy2 = $next[1] - $curr[1];

			// Normalizar y calcular normales
			$length1 = sqrt( $vx1 * $vx1 + $vy1 * $vy1 );
			$length2 = sqrt( $vx2 * $vx2 + $vy2 * $vy2 );

			$nx1 = -$vy1 / $length1;
			$ny1 = $vx1 / $length1;

			$nx2 = -$vy2 / $length2;
			$ny2 = $vx2 / $length2;

			// Promediar las normales
			$nx = ( $nx1 + $nx2 ) / 2;
			$ny = ( $ny1 + $ny2 ) / 2;

			// Normalizar la normal combinada
			$nLength = sqrt( $nx * $nx + $ny * $ny );
			$nx     /= $nLength;
			$ny     /= $nLength;

			// Desplazar el punto
			$expandedX = $curr[0] + $outline * $nx;
			$expandedY = $curr[1] + $outline * $ny;

			$expandedPoints[] = "$expandedX,$expandedY";
		}

		return implode( ' ', $expandedPoints );
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
