/**
 * Step map 1 does not have custom js to apply.
 * The GF coco-map field works ok out of the box.
 */
import { createNotification } from './notification-api';
import { convertStringCoordsInLatLng } from './trigonometry-helpers';
import { CocoMapSetup } from './types';

/**
 * Returns the CocoMapSetup object for the step2 map (the one with the input text element
 * identified by window.step2CocoMapInputId). The default export of this script
 *
 * @returns {CocoMapSetup | null}
 */
const getStep1CocoMapSetup = (): CocoMapSetup | null => {
	const cocoMapSetup = window.cocoMaps[window.step1CocoMapInputId];
	return cocoMapSetup ?? null;
};

/** Start everything  */

document.addEventListener('solarMapReady' as keyof DocumentEventMap, (event: Event) => {
	// setup and validations
	const customEvent = event as CustomEvent<CocoMapSetup>;
	const cocoMapSetup = getStep1CocoMapSetup();
	if (
		!window.cocoIsStepSelectRoof ||
		!cocoMapSetup ||
		cocoMapSetup.inputElement.id !== customEvent.detail.inputElement.id
	) {
		console.log('are we in step 1? NO');
		return;
	}
	console.log('are we in step 1? YES');

	// Initial state for step 1. If there is a default value, we move to the state thatzoom to 19
	setup_step_1(cocoMapSetup);
});

/**
 * State: Select a marker on the map. (or select a roof).
 * Shows a message to the user and
 * Applies the zoom to the map when the user selects a roof.
 */
function setup_step_1(mapSetup: CocoMapSetup) {
	// TODO: make the Next button unavailable
	createNotification('STEP1_SELECT_ROOF');

	const inputElement = mapSetup.inputElement;

	// if on page load there is already a value, we zoom to 19
	show_message_to_click_next(mapSetup.map, inputElement);

	// show a message when the user selects a roof "click on the next button"
	inputElement.addEventListener('input', (event: Event) => {
		show_message_to_click_next(mapSetup.map, inputElement);
	});
}

function show_message_to_click_next(map: google.maps.Map, inputEl: HTMLInputElement) {
	if (inputEl.value) {
		// State: Shows message to move forward, make the NEXT btn available
		const coords = convertStringCoordsInLatLng(inputEl);
		if (!coords) {
			createNotification('Error in the value of the input');
			return;
		}
		const currentZoom = map.getZoom();
		if (currentZoom && currentZoom < 19) {
			map.panTo(coords);
			map.setZoom(19);
		}
		createNotification('STEP1_ROOF_SELECTED');
	}
}
