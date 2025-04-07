/**
 * In step 2, there is a select input with class 'segment-rotation', made in GF
 * Depending on the value of this select, we will rotate the segments in the map or not
 * (but only the segments which are higher than wide).
 *
 * Here the functions that handle that behaviour.
 */

import setupSegments from './setup-segments-interactive-functions';
import { SelectRotationPortraitSegmentsOptions } from './types';

/**
 * The code flow of this feature: applying on page load
 * the rotation or not for the segments which are portrait.
 */
document.addEventListener('DOMContentLoaded', () => {
	const inputOptions = document.querySelectorAll('.segment-rotation input');
	inputOptions?.forEach((radio) => {
		radio.addEventListener('change', (event) => {
			setupSegments(false);
		});
	});
});

/**
 * Retrieve the value in radio button 'no-extra-rotation' or 'extra-rotation'
 * @param fallback
 * @returns
 */
export const getRotationTypePortraitSelected = (
	fallback = 'no-extra-rotation'
): SelectRotationPortraitSegmentsOptions => {
	const radioParent = document.querySelector('.segment-rotation');
	const selected = radioParent?.querySelector('input:checked');
	if (selected) {
		return (selected as HTMLInputElement).value as SelectRotationPortraitSegmentsOptions;
	}
	return fallback as SelectRotationPortraitSegmentsOptions;
};
