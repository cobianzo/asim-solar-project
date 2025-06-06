/**
 * Step map 4 does not have custom js to apply.
 */
import { createTopNotification } from './notification-api';

/** Start everything  */

document.addEventListener('DOMContentLoaded', () => {
	// setup and validations
	if (window.gf_current_page !== '4') {
		return;
	}
	setup_step_4();

	setTimeout(() => {
		const totalenergy = document.querySelector('#total-energy')?.textContent?.replace(',', '');
		const inputStep4 = document.querySelector('.power-calculations input');
		if (totalenergy && inputStep4) {
			(inputStep4 as HTMLInputElement).value = totalenergy;
		}
	}, 500);
});

/**
 */
function setup_step_4() {
	createTopNotification('STEP4_WHATEVER');
}
