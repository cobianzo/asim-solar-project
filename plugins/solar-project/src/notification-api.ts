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

/**
 * Important. There are two kind of notifications
 * 1) The simple ones: a bar on top of the screen.
 * 2) The complex one, a popup on the left of the screen.
 */



/**
 * Usage:
 * test it with
 * debug.createTopNotification('STEP1_ROOF_SELECTED');
 *
 * @param message
 * @returns
 */
// Debounce helper function
const debounce = (func: Function, wait: number) => {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Actual notification for the top of the page.
const createTopNotificationImpl = async(message: string, placeholders: string[] = []) => {


  // locallized file with texts.
  const PRESET_MSG = await import(`./notification-texts/${window.cocoLanguage || 'en'}.json`);

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
    placeholders.forEach((placeholder) => {
      messageText = messageText.replace(`%s`, placeholder);
    });
  }

  notificationDiv.innerHTML = messageText;
};

// Export debounced version with 3 second delay
export const createTopNotification = (m:string, pl: string[] = []) => {
  // Notifications to listeners so I can inject code from external plugins.
  /**
   * Usage:
   * addEventListener( 'cocoTopNotificationShown' , (event) => {
   *   console.log('Notification shown:', event.detail.m);
   */
  document.dispatchEvent(new CustomEvent('cocoTopNotificationShown', {
    detail: { m }
  }));
  createTopNotificationImpl(m,pl);
}


export const removeTopNotification = (messageKey?: string | null) => {
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

// ================
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

const openNotificationPopupImpl = (filename: string, placeholders: Record<string, string | number> = {}) => {
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

			// Ensure html is a string, otherwise return early
			if (typeof html !== 'string') {
				console.error('Error: Received non-string HTML response');
				return;
			}

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
				html = (html as string).replace(regex, value);
			});

			// show the message
			contentContainer.innerHTML = html;
			parentDiv.classList.remove('hidden');
			parentDiv.classList.add('show');
		})
		.catch((error) => console.error('Error loading the notification ' + filename + ':', error));
};

export const openNotificationPopup = debounce( openNotificationPopupImpl, 1000);


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
	openNotificationPopup(`segmentInfo`, {
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
