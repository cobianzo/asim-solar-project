<?php

namespace Coco_Solar;

class Google_Maps_API extends API {

	protected static string $base_endpoint = 'https://maps.googleapis.com/maps/api/';

	/**
	 * Generic call for Google Maps API
	 *
	 * @param string $method The string to append to the base endpoint
	 * @param array $data
	 * @return mixed
	 */
	public static function get( string $method, array $data = array() ) : array | bool {
		return parent::get_google_api_response( self::$base_endpoint, $method, $data );
	}

	public static function get_maps_building_data( float|string $latitude, float|string $longitude ) : array | bool{
		return self::get( 'geocode/json', array(
			'latlng'             => "$latitude, $longitude",
			'extra_computations' => 'BUILDING_AND_ENTRANCES',
		) );
	}

	// helper to make the relevant data from the response easier to access
	public static function extract_building_profile_from_map_geocode_response( $response ) {
		$buildings_string_coord = array(); // every item represents a building
		foreach ( $response['results'] as $single_result ) {
			if ( isset( $single_result['buildings'] ) ) {
				foreach ( $single_result['buildings'] as $building_data_iterate ) {
					$shapes = $building_data_iterate['building_outlines'];
					foreach ( $shapes as $roof_shape ) {
						$coords_group = $roof_shape['display_polygon']['coordinates'];
						foreach ( $coords_group as $coordinates ) {
							$coord_string             = implode( ' ', array_map( function ( $coord ) {
								return $coord[1] . ',' . $coord[0];
							}, $coordinates ) );
							$buildings_string_coord[] = $coord_string;
						}
					}
				}
			}
		}
		// phpcs:ignore Squiz.PHP.CommentedOutCode.Found
		return $buildings_string_coord; // ['43.234,1.32 44.23,1.33 ... ' , '124.43,-1.44 124...']
	}

}