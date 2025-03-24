<?php

namespace Coco_Solar;

class Google_Solar_API extends API {

	protected static string $base_endpoint = 'https://solar.googleapis.com/v1/';

	/**
	 * Generic call for Google Solar API
	 *
	 * @param string $method The string to append to the base endpoint
	 * @param array $data
	 * @return mixed
	 */
	public static function get( string $method, array $data = array() )  {
		return self::get_google_api_response( self::$base_endpoint, $method, $data );
	}

	/**
	 * Returns the closest building and its associated roof and walls
	 *
	 * @param float $latitude
	 * @param float $longitude
	 * @return array|bool
	 */
	public static function get_solar_building_data( float $latitude, float $longitude )  {
		return self::get( 'buildingInsights:findClosest', array(
			'location.latitude'  => $latitude,
			'location.longitude' => $longitude,
			'requiredQuality'    => 'HIGH',
		) );
	}

	/**
	 * NOT IN USE! : Gets the datalayer URLs for the given coordinates.
	 *
	 * @param float $latitude
	 * @param float $longitude
	 * @param array $extra_params Additional parameters to be passed to the API
	 * @return array|bool
	 */
	public static function get_datalayer_urls( float $latitude, float $longitude, $extra_params = array() ) {
		$data = array_merge( array(
			'location.latitude'    => $latitude,
			'location.longitude'   => $longitude,
			'radiusMeters'         => '100', // Ajusta el radio según necesidad
			'requiredQuality'      => 'LOW',
			'view'                 => 'FULL_LAYERS',
			'exactQualityRequired' => true,
			'pixelSizeMeters'      => 0.5,
		), $extra_params );

		// get the geogiff images
		$response = self::get( 'dataLayers:get', $data );
		return $response;
	}

}