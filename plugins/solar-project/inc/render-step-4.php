<?php
// capture the data from the form

use Coco_Solar\Helper;

$form_id = $_POST['gform_submit'] ?? Helper::get_gravity_form_id_from_page();
$form    = \GFAPI::get_form( $form_id );

// retrieve info in the form inserted by the user.
$length_field = Helper::capture_coco_map_field_instance( $form, 'panel-length' );

$roof_coords = Helper::capture_coco_map_field_instance( $form, 'map-roof' );

$length_field     = Helper::capture_coco_map_field_instance( $form, 'panel-length' );
$height_field     = Helper::capture_coco_map_field_instance( $form, 'panel-height' );
$efficiency_field = Helper::capture_coco_map_field_instance( $form, 'panel-efficiency' );
$quantiles_field  = Helper::capture_coco_map_field_instance( $form, 'panel-quantiles' );
$model_field      = Helper::capture_coco_map_field_instance( $form, 'panel-model-dropdown' );
$model_label      = '';
foreach ( $model_field->choices as $choice ) {
	if ( intval( $choice['value'] ) === intval( $model_field->value ) ) {
		$model_label = $choice['text'];
		break;
	}
}

// retrieve info from the roofs (it's cached), from the solar API.
$coords        = explode( ',', $roof_coords->value );
$building_data = \Coco_Solar\Google_Solar_API::get_solar_building_data( $coords[0], $coords[1] );
$roofs         = $building_data['solarPotential']['roofSegmentStats'] ?? null;

?>

<h2><?php _e( 'Energy Report', 'solar-project' ); ?></h2>

<p class="fw-bold">
	<?php
	$total_energy = 0;
	foreach ( $roofs as $roof ) {
		$roof_energy = 0;
		foreach ( $roofs as $segment ) {
			$roof_energy += calculate_energy( $segment, $roof['hoursPerYear'][ $scenario ] );

			// calculate energy for the roof:



		}
		$total_energy += $roof_energy;
	}
	printf( __( 'Total Energy Production: <strong>%s kWh/year</strong>', 'solar-panel' ), number_format( $total_energy, 2 ) );
	?>
</p>

	<div id="report">
			<?php foreach ( $roofs as $i => $roof ) : ?>
					<h3><?php printf( __( 'Segment %d', 'solar-panel' ), $i + 1 ); ?></h3>
					<p>
							<?php printf( __( 'Pitch: %1$d°, Orientation: %2$s, Area: %3$d m²', 'solar-panel' ), $roof['pitch'], esc_html( $roof['orientation'] ), $roof['area'] ); ?>
					</p>
					<table class="table">
							<thead>
									<tr>
											<th><?php esc_html_e( 'Segment', 'solar-panel' ); ?></th>
											<th><?php esc_html_e( 'Panels', 'solar-panel' ); ?></th>
											<th><?php esc_html_e( 'Model', 'solar-panel' ); ?></th>
											<th><?php esc_html_e( 'Power per Panel', 'solar-panel' ); ?></th>
											<th><?php esc_html_e( 'Annual Energy (kWh)', 'solar-panel' ); ?></th>
									</tr>
							</thead>
							<tbody>
									<?php foreach ( $roof['segments'] as $segment ) : ?>
											<tr>
													<td><?php echo esc_html( $segment['id'] ); ?></td>
													<td><?php echo esc_html( $segment['panels'] ); ?></td>
													<td><?php echo esc_html( $segment['panelModel'] ); ?></td>
													<td><?php echo esc_html( $segment['power'] ); ?> W</td>
													<td><?php echo number_format( calculate_energy( $segment, $roof['hoursPerYear'][ $scenario ] ), 2 ); ?> kWh</td>
											</tr>
									<?php endforeach; ?>
							</tbody>
					</table>
					<p>
							<strong>
									<?php printf( __( 'Total Energy for %1$s: %2$s kWh/year', 'solar-panel' ), esc_html( $roof['name'] ), number_format( $roof_energy, 2 ) ); ?>
							</strong>
					</p>
			<?php endforeach; ?>
	</div>



<?php
