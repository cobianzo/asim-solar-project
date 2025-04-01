<?php

class Gravity_Model_Panel {

	public static function init() {
		add_filter( 'gform_pre_render', [ __CLASS__, 'populate_panel_dropdown' ] );
		add_filter( 'gform_pre_validation', [ __CLASS__, 'populate_panel_dropdown' ] );
		add_filter( 'gform_pre_submission_filter', [ __CLASS__, 'populate_panel_dropdown' ] );
		add_filter( 'gform_admin_pre_render', [ __CLASS__, 'populate_panel_dropdown' ] );
	}

	public static function populate_panel_dropdown($form) {
		foreach ($form['fields'] as &$field) {
			if ($field->type !== 'select' || $field->inputName !== 'panel_list') {
				continue;
			}

			// Obtener los posts del CPT "panel"
			$panels = get_posts([
				'post_type'      => 'panel',
				'posts_per_page' => -1,
				'orderby'        => 'title',
				'order'          => 'ASC',
			]);

			// Limpiar opciones previas
			$field->choices = [];

			// Agregar opciones dinámicas
			foreach ($panels as $panel) {
				$field->choices[] = [
					'text'  => $panel->post_title, // Texto visible en la lista
					'value' => $panel->ID, // Valor almacenado en el formulario
				];
			}
		}

		return $form;
	}
}

// Initialize the hooks
Gravity_Model_Panel::init();
