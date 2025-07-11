import { createTopNotification } from './notification-api';
import { updateValuesCoordsSegmentsFromDBOffset } from './setup-drag-all-segments-interaction';
import { loadSavedRectanglesFromTextArea } from './setup-rectangle-interactive';
import setupSegments from './setup-segments-interactive-functions';
import { applyListenersToPanelModelsDropdown, loadModelPanelParametersInInputs } from './setup-solar-panels';
import { CocoMapSetup } from './types';

/**
 * Returns the CocoMapSetup object for the step3 map (the one with the input text element
 * identified by window.step3CocoMapInputId). The default export of this script
 *
 * @returns {CocoMapSetup | null}
 */
export const getStep3CocoMapSetup = function (): CocoMapSetup | null {
	const cocoMapSetup = window.cocoMaps[window.step3CocoMapInputId];
	return cocoMapSetup ?? null;
};

document.addEventListener('solarMapReady', (event: Event) => {

	// setup and validations
	const cocoMapSetup = getStep3CocoMapSetup();
	if (
		!window.cocoIsStepSelectRectangle ||
		!cocoMapSetup ||
		cocoMapSetup.inputElement.id !== (event as CustomEvent<CocoMapSetup>).detail.inputElement.id
	)
		return;

	// this also paints the bounding box. It is needed as reference of the offset for all segments.
	updateValuesCoordsSegmentsFromDBOffset();
	window.cocoMovingBoundingBoxPolygon?.setVisible(false);

	// paint paint paint! and make them interactive
	setupSegments();

	// if this in not the first time we load this page
	loadSavedRectanglesFromTextArea();

	// notification
	if (window.cocoSavedRectangles?.length) {
		createTopNotification('STEP3_EDIT_OR_SELECT', [window.cocoSavedRectangles?.length.toString()]);
	} else {
		createTopNotification('STEP3_SELECT_SEGMENT', [window.cocoBuildingSegments?.length.toString()]);
	}

	// Sync inputs on page load
	loadModelPanelParametersInInputs();
	applyListenersToPanelModelsDropdown();
});
