// WordPress dependencies
import apiFetch from '@wordpress/api-fetch';
import { getCurrentStepCocoMap } from '.';
import { ExtendedSegment } from './types';
import { getSavedRectangleBySegment } from './setup-rectangle-interactive';
import {
	getAnnualGeneratedPower,
	getCurrentHoursPerYear,
	getCurrentPanelsDimensions,
	getCurrentPanelsModel,
	getCurrentPanelsNominalPower,
	getCurrentPanelsSystemEfficiency,
	getCurrentQuantilScenario,
	getNumberOfPanelsInRectangle,
	getSolarPanelsSurface,
} from './setup-solar-panels';
import { getCardinalOrientationFromAngle } from './trigonometry-helpers';

const PRESET_MSG: Record<string, string> = {
	STEP1_SELECT_ROOF: 'Please select a roof in the map where you want to install your solar panels.',
	STEP1_ROOF_SELECTED: 'Good. You have selected the roof. Now, click on the next button.',
	STEP2_DRAGGABLE_BOUNDING_BOX:
		'We have detected %s segments in your roof. There might be a small displacement with the satellite image, please adjust it by dragging the segments',
	STEP2_RETURNING: 'Check that the red squares are the most aligned possible to the shape of the roof',
	STEP3_EDIT_OR_SELECT:
		'You have setup the sola panel for %s of the roofs. You can keep on editing or submit the fotm by clicking NEXT',
	STEP3_SELECT_SEGMENT:
		'There are %s segments on this building. Please start by selecting one of them to create your solar panel installation',
	STEP3_SEGMENT_SELECTED:
		'Good. You have selected one of the segments of %s square meters. Now click again on the segment to start designing the rectangle of your solar panel installation',
	STEP3_SEGMENT_SELECTED_WITH_RECTANGLE:
		'You can remove the individual solar panels by clicking on the button Edit Solar Panels and selecting the panels that you want to remove',
	STEP3_CLICK_ON_SOLAR_PANEL:
		'When you finish editing the solar panels, you can click on Save to apply the changes.',
	STEP3_START_EDIT_PANELS:
		'Pass the button over the solar panels. You can remove some of them by clicking it over',
	STEP3_HOVERING_SEGMENT:
		'This is the roof segment %s with an area of %s square meters and a tilt of %s degrees.',
	STEP3_HOVERING_SEGMENT_WITH_RECTANGLE: 'Click to edit or delete the solar panel rectangle.',
	STEP3_FIRST_VERTEX_RECTANGLE:
		'You have just selected the first vertex of the rectangle where your panels will be placed. <br> Now choose the size of the rectangle and click the mouse when ready. You can always resize the rectangle later.',
	STEP3_SECOND_VERTEX_RECTANGLE:
		'The rectangle has been updated. Now you can click on Save to apply the changes.',
	STEP4_WHATEVER: 'Here you have your solar installation report',
};

/**
 * Usage:
 * test it with
 * debug.createNotification('STEP1_ROOF_SELECTED');
 *
 * @param message
 * @returns
 */
export const createNotification = (message: string, placeholders: string[] = []) => {
	//cleanup
	window.cocoNotifications = window.cocoNotifications ?? {};
	if (window.cocoNotifications?.container) {
		window.cocoNotifications.container.remove();
	}

	// get the current map
	const cocoMapSetup = getCurrentStepCocoMap();
	if (!cocoMapSetup) {
		return;
	}

	let messageText = message;

	const parentConteiner = cocoMapSetup.map.getDiv();

	const notificationDiv = document.createElement('div');
	notificationDiv.classList.add('coco-solar-notification');
	notificationDiv.textContent = message;
	(parentConteiner?.parentNode ?? document.body).insertBefore(notificationDiv, parentConteiner);
	window.cocoNotifications.container = notificationDiv;

	// retrieve the message:
	if (PRESET_MSG[messageText]) {
		notificationDiv.dataset.messageId = messageText;
		messageText = PRESET_MSG[messageText];
	}

	// replacements. Replace the %s with the array of placeholders
	if (placeholders.length) {
		placeholders.forEach((placeholder, index) => {
			messageText = messageText.replace(`%s`, placeholder);
		});
	}

	notificationDiv.innerHTML = messageText;
};

export const removeNotification = (messageKey?: string | null) => {
	if (window.cocoNotifications?.container) {
		if (!messageKey || window.cocoNotifications.container.dataset.messageId === messageKey) {
			console.log('Removing notification', messageKey);
			window.cocoNotifications.container.remove();
			window.cocoNotifications.container = null;
			window.cocoNotifications = {};
		}
	}
	// TODO: remove only if the message key is given.
};

// Now the notifications more complex. The ones that load an html in a popup

export const closeNotificationPopup = function () {
	const parentDiv = document.getElementById('popup-generic');
	const contentContainer = parentDiv?.querySelector('.popup-generic-content');

	if (!parentDiv || !contentContainer) return;
	parentDiv.classList.add('hidden');
	parentDiv.classList.remove('show');
	contentContainer.innerHTML = '';
};
window.closeNotificationPopup = closeNotificationPopup;

export const openNotificationPopup = (filename: string, placeholders: Record<string, string | number> = {}) => {
	//cleanup
	closeNotificationPopup();

	// init
	const parentDiv = document.getElementById('popup-generic');
	const contentContainer = parentDiv?.querySelector('.popup-generic-content');
	if (!parentDiv || !contentContainer) return;

	console.log(`>> showing notification notifications/${filename}`, placeholders);
	// retrieve the message
	const path = `coco-solar/v1/notifications/${filename}`;
	apiFetch({ path })
		.then((html) => {
			// handle the error of an html 40x response
			if (html.includes('<title>40')) {
				console.error('Error: Received a 40x error response');
				return;
			}

			// Replacement placeholders in the HTML, handlevars syntax
			Object.keys(placeholders).forEach((key) => {
				const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
				const value =
					typeof placeholders[key] === 'number' ? String(placeholders[key]) : placeholders[key];
				html = html.replace(regex, value);
			});

			// show the message
			contentContainer.innerHTML = html as string;
			parentDiv.classList.remove('hidden');
			parentDiv.classList.add('show');
		})
		.catch((error) => console.error('Error loading the notification ' + filename + ':', error));
};

// Special notification with all the info about the segment and its rectangle
export const createPanelNotificationPopup = function (segment: ExtendedSegment | null = null) {
	if (!segment) {
		segment = window.cocoDrawingRectangle?.selectedSegment ?? null;
	}
	if (!segment) {
		return;
	}

	const hasRectangle = getSavedRectangleBySegment(segment);

	let numberOfSolarPanels,
		annualPower,
		panelDimansions,
		panelsSurface,
		systemEfficiency,
		panelsModel,
		scenarioName,
		hoursPerYear,
		nominalPower,
		// now total values for all the segments (all roof)
		totalPanelsSurface: number = 0,
		totalAnnualPower: number = 0,
		totalNumberPanels: number = 0;
	let percentilesHoursPerYear: Record<string, number> = {};
	segment.data?.stats.sunshineQuantiles.forEach((perc, i) => {
		percentilesHoursPerYear[`percentil_${i}`] = parseInt(perc.toString());
	});
	if (hasRectangle) {
		numberOfSolarPanels = getNumberOfPanelsInRectangle(hasRectangle);
		annualPower = getAnnualGeneratedPower(hasRectangle);
		panelDimansions = getCurrentPanelsDimensions().join('m x ') + 'm';
		panelsSurface = getSolarPanelsSurface(hasRectangle);
		systemEfficiency = getCurrentPanelsSystemEfficiency();
		panelsModel = getCurrentPanelsModel();
		nominalPower = getCurrentPanelsNominalPower();
		const scenario = getCurrentQuantilScenario();
		scenarioName = scenario.scenarioName;
		hoursPerYear = getCurrentHoursPerYear(segment);

		// total values for all the segments (all roof)
		const allRectangles = window.cocoSavedRectangles ?? [];
		allRectangles.forEach((rectangle) => {
			totalPanelsSurface += getSolarPanelsSurface(rectangle);
			totalAnnualPower += getAnnualGeneratedPower(rectangle);
			totalNumberPanels += getNumberOfPanelsInRectangle(rectangle);
		});
	}
	// popup on the top left.
	openNotificationPopup('segmentInfo', {
		...segment.data,
		...{
			indexInMap: segment.indexInMap! + 1,
			orientation: getCardinalOrientationFromAngle(segment.data?.azimuthDegrees!).join(', '),
			pitchDegrees: segment.data!.pitchDegrees.toFixed(1),
			azimuthDegrees: segment.data!.azimuthDegrees.toFixed(1),
			showRectangleInfo: hasRectangle ? 'yes' : 'no',
			numberOfSolarPanels,
			annualPower: annualPower
				? annualPower.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
				: 0,
			panelDimansions,
			panelsSurface,
			nominalPower,
			systemEfficiency,
			maxSunshineHoursPerYear: window.cocoSolarPotential.maxSunshineHoursPerYear.toFixed(0),
			panelsModel,
			scenarioName,
			hoursPerYear: hoursPerYear?.toFixed(0),
			// whle roof calculations
			showTotalData: totalNumberPanels ? 'yes' : 'no',
			totalPanelsSurface: totalPanelsSurface.toFixed(2),
			totalAnnualPower: totalAnnualPower.toLocaleString('de-DE', {
				minimumFractionDigits: 0,
				maximumFractionDigits: 2,
			}),
			totalNumberPanels,
		},
		...percentilesHoursPerYear, // access with percentil_0
	} as unknown as Record<string, string>);
};
