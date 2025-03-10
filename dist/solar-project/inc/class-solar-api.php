<?php

namespace Coco_Solar;

class Solar_API {

	public static $base_solar_endpoint = 'https://solar.googleapis.com/v1/';
	public static $base_maps_endpoint = 'https://maps.googleapis.com/maps/api/';

	// hardcoded so far. TODO:
	public static function get_google_api() {
		$key = 'AIzaSyB3FE3KIBaI8qOWxZCYuUbYRQDBs61a6v0';
		return $key;;
	}


	/**
	 * Generic call by GET to the Google API
	 * Usage:
	 * 	get_solar_api_response( 'buildingInsights:findClosest', [ 'location.latitude' => 47.25, 'location.longitude' => -1.5583 ] )
	 *
	 * @param string $base_url
	 * @param string $method
	 * @param array $data
	 * @return mixed
	 */
	public static function get_google_api_response( string $base_url, string $method, array $data = [] ) {
		$api_url       = $base_url . $method;
		$transient_key = '_google_api_' . md5( $api_url . serialize( $data ) );
		$cached_response = get_transient( $transient_key );

		// debug prints
		// echo $api_url . '<br><br>';
		// echo json_encode( $data, JSON_PRETTY_PRINT );
		if ( $cached_response !== false ) {
			$cached_response['cached'] = true;
			return $cached_response;
		}

		$data['key'] = self::get_google_api();
		$response = wp_remote_get( $api_url, array( 'body' => $data ) );

		if ( is_wp_error( $response ) ) {
			return false;
		}

		$response_body = wp_remote_retrieve_body( $response );
		$decoded_response = json_decode( $response_body, true );

		set_transient( $transient_key, $decoded_response, 5 * DAY_IN_SECONDS );

		return $decoded_response;
	}


	/**
	 * Generic call for Solar API
	 *
	 * @param string $method
	 * @param array $data
	 * @return mixed
	 */
	public static function get_solar_api_response( string $method, array $data = [] ) {
		return self::get_google_api_response( self::$base_solar_endpoint, $method, $data );
	}
	public static function get_maps_api_response( string $method, array $data = [] ) {
		return self::get_google_api_response( self::$base_maps_endpoint, $method, $data );
	}

	public static function get_solar_building_data( $latitude, $longitude ) {
		return self::get_solar_api_response( 'buildingInsights:findClosest', [
			'location.latitude'  => $latitude,
			'location.longitude' => $longitude,
			'requiredQuality'    => 'HIGH',
		] );
	}

	public static function get_maps_building_data( $latitude, $longitude ) {
		return self::get_maps_api_response( 'geocode/json', [
			'latlng' => "$latitude, $longitude",
			'extra_computations' => 'BUILDING_AND_ENTRANCES'
		] );
	}
	public static function extract_building_profile_from_map_geocode_response( $response ) {
		$buildings_string_coord = []; // every item represents a building
		foreach ( $response['results'] as $single_result ) {
			if ( isset( $single_result['buildings'] ) ) {
				foreach ( $single_result['buildings'] as $building_data_iterate ) {
					$shapes = $building_data_iterate['building_outlines'];
					foreach ( $shapes as $roof_shape ) {
						$coords_group = $roof_shape['display_polygon']['coordinates'];
						foreach ( $coords_group as $coordinates ) {
							$coord_string = implode( ' ', array_map( function ( $coord ) {
								return $coord[1] . ',' . $coord[0];
							}, $coordinates ) );
							$buildings_string_coord[] = $coord_string;
						}
					}
				}
			}
		}
		return $buildings_string_coord; // ['43.234,1.32 44.23,1.33 ... ' , '124.43,-1.44 124...']
	}


	public static function get_datalayer_urls( $latitude, $longitude, $extra_params = [] ) {
		$data = array_merge( [
				'location.latitude'    => $latitude,
				'location.longitude'   => $longitude,
				'radiusMeters'         => '100', // Ajusta el radio según necesidad
				'requiredQuality'      => 'LOW',
				'view'                 => 'FULL_LAYERS',
				'exactQualityRequired' => true,
				'pixelSizeMeters'      => 0.5,
		], $extra_params );

		// get the geogiff images
		$response = self::get_google_api_response( self::$base_solar_endpoint, 'dataLayers:get', $data );
		return $response;
	}
}