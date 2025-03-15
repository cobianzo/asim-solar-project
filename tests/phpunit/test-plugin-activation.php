<?php

class PluginTest extends WP_UnitTestCase {

		public function test_plugin_activado() {

			activate_plugin( 'tu-plugin/tu-plugin.php' );

			if ( is_plugin_active( 'solar/solar.php' ) ) {
					$this->assertTrue( true, 'solar.php PLUGIN ACTIVATED' );
			} else {
					$this->fail( 'Error: Plugin solar.php is not activated. We need it for testing' );
			}
	}
}
