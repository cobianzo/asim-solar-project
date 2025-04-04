/**
 * Step map 4 does not have custom js to apply.
 */
import { createNotification } from './notification-api';

/** Start everything  */

document.addEventListener('DOMContentLoaded', () => {
	// setup and validations
	if (window.gf_current_page !== '4') {
		return;
	}
	setup_step_4();
});

/**
 */
function setup_step_4() {
	createNotification('STEP4_WHATEVER');
}
