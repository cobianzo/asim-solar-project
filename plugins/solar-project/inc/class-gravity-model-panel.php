<?php

/**
 * Undocumented class
 */
class Gravity_Model_Panel {

	public static function init() {
		add_filter( 'gform_pre_render', array( __CLASS__, 'populate_panel_dropdown' ) );
		add_filter( 'gform_pre_validation', array( __CLASS__, 'populate_panel_dropdown' ) );
		add_filter( 'gform_pre_submission_filter', array( __CLASS__, 'populate_panel_dropdown' ) );
		add_filter( 'gform_admin_pre_render', array( __CLASS__, 'populate_panel_dropdown' ) );

		// change the `<input step=0.01` in the field efficienciy
		add_filter('gform_field_content', function ( $content, $field ) {
			if ( $field->type === 'number' && $field->adminLabel === 'panel-efficiency' ) {
					$content = str_replace( '<input', '<input step="0.01"', $content );
			}
			return $content;
		}, 10, 2);
	}

	/**
	 * Undocumented function
	 *
	 * @param Array $form
	 * @return Array $form
	 */
	public static function populate_panel_dropdown( array $form ): array {
		foreach ( $form['fields'] as &$field ) {
			if ( $field->type !== 'select' || $field->inputName !== 'panel_list' ) {
				continue;
			}

			// Obtener los posts del CPT "panel"
			$panels = get_posts(array(
				'post_type'      => 'panel',
				'posts_per_page' => -1,
				'orderby'        => 'title',
				'order'          => 'ASC',
			));

			// Limpiar opciones previas
			$field->choices   = array();
			$field->choices[] = array(
				'text'  => __( '--Custom--', 'solar-project' ),
				'value' => 'x',
			);

			// Agregar opciones dinámicas
			foreach ( $panels as $panel ) {
				$field->choices[] = array(
					'text'  => $panel->post_title, // Texto visible en la lista
					'value' => $panel->ID, // Valor almacenado en el formulario
				);
			}
		}

		return $form;
	}
}

// Initialize the hooks
Gravity_Model_Panel::init();
