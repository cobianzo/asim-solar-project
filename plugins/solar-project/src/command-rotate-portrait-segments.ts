/**
 * In step 2, there is a select input with class 'segment-rotation', made in GF
 * Depending on the value of this select, we will rotate the segments in the map or not
 * (but only the segments which are higher than wide).
 *
 * Here the functions that handle that behaviour.
 */

import { createDraggableBoundingBoxForMovingAllSegments } from "./setup-drag-all-segments-interaction";
import setupSegments from "./setup-segments-interactive-functions";
import { SelectRotationPortraitSegmentsOptions } from "./types";

document.addEventListener('DOMContentLoaded', () => {
  const inputOptions = document.querySelectorAll('.segment-rotation input');
  inputOptions?.forEach((radio) => {
    radio.addEventListener('change', (event) => {
      applyRotationPortraitSegmentsByRadioSelected();
    });
  });
});

export const getRotationPortraitSelected = (): SelectRotationPortraitSegmentsOptions => {
  const radioParent = document.querySelector('.segment-rotation');
  const selected = radioParent?.querySelector('input:checked');
  if (selected) {
    return ((selected as HTMLInputElement).value as SelectRotationPortraitSegmentsOptions);
  }
  return 'no-extra-rotation';
}

const applyRotationPortraitSegmentsByRadioSelected = (): SelectRotationPortraitSegmentsOptions => {
  const valorSeleccionado = getRotationPortraitSelected();
  console.log(`Opción seleccionada: ${valorSeleccionado}`);
  setupSegments( valorSeleccionado as SelectRotationPortraitSegmentsOptions );

  createDraggableBoundingBoxForMovingAllSegments();

  return valorSeleccionado;
}