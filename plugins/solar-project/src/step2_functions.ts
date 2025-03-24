/**
 * Origin of call to functions happening in step 2:
 * Step 2 of the GF: setup of the position of the segments: the offset and the orientation.
 */
// types
import { CocoMapSetup } from './types';

import {
  paintBoundingBoxAsRectangle,
  paintPolygonsByArrayOfStrings,
 } from './drawing-helpers';
import {getMovingBoundingBoxOffsetFromOrigin, getOffsetFromValueInDB, updateMovingBoundingBoxFromDBOffset, updateValuesCoordsSegmentsFromDBOffset, updateValuesCoordsSegmentsWithOffset} from './setup-drag-all-segments-interaction';
import setupSegments from './setup-segments-interactive-functions';
import { createNotification } from './notification-api';


/**
 * Returns the CocoMapSetup object for the step2 map (the one with the input text element
 * identified by window.step2CocoMapInputId). The default export of this script
 * @returns {CocoMapSetup | null}
 */
const getStep2CocoMapSetup = () : CocoMapSetup | null => {
  const cocoMapSetup = window.cocoMaps[window.step2CocoMapInputId];
  return cocoMapSetup ?? null;
}

/** Start everything  */

document.addEventListener("solarMapReady" as keyof DocumentEventMap, (event: Event) => {

  // setup and validation
  const cocoMapSetup = getStep2CocoMapSetup();
  if ( ! window.cocoIsStepSelectOffset || ! cocoMapSetup
    || ( cocoMapSetup.inputElement.id !== (event as CustomEvent<CocoMapSetup>).detail.inputElement.id ) ) {
    return;
  }

  /**  ================ ================ ================ ================
   *  PAINTS THE PROFILE OF THE BUILDING. The data has been exposed with PHP.
   *  ================ ================ ================ ================*/
  // design polygon of the whole roof profile (todelete, it does not always work)
  if (window.cocoBuildingProfile?.length) {
    paintPolygonsByArrayOfStrings(cocoMapSetup.map, window.cocoBuildingProfile, { strokeColor: 'black' });
  }

  /**
   * =======
   */
  // Paint Moving Bounding box according t sw ne values
  window.cocoMovingBoundingBoxPolygon = paintBoundingBoxAsRectangle(window.cocoOriginalBoundingBox);

  /**
   * Particular case for pageload:
   *  This is not the first time we visit this page, and
   * the value of the offset has been previouly inserted, and accessible in the DB (window.step2·OffsetInserted)
   */
  if ( window.step2OffsetInserted ) {
    updateMovingBoundingBoxFromDBOffset();
    updateValuesCoordsSegmentsFromDBOffset();

    createNotification('STEP2_RETURNING');
  } else {
    createNotification('STEP2_DRAGGABLE_BOUNDING_BOX', [cocoMapSetup.segments?.length.toString()! ]);
  }

  // verification sw ne: TODELETE
  // const deviation = (window.cocoOriginalBoundingBox.ne.longitude - window.cocoMovingBoundingBoxPolygon!.getBounds()!.getNorthEast().lng())
  //     + (window.cocoOriginalBoundingBox.ne.latitude - window.cocoMovingBoundingBoxPolygon!.getBounds()!.getNorthEast().lat())
  //     + (window.cocoOriginalBoundingBox.sw.latitude - window.cocoMovingBoundingBoxPolygon!.getBounds()!.getSouthWest().lat())
  //     + (window.cocoOriginalBoundingBox.sw.longitude - window.cocoMovingBoundingBoxPolygon!.getBounds()!.getSouthWest().lng());
  // if (deviation !== 0) {
  //   alert('error in placing rect.');
  // } else {
  //   console.log('>>>>> Rect well placed!!!');
  // }

  /**
   * Now creating the segments is of because the source of truth
   * with their coordenates has the offset, if it has been insterted.
   */
  setupSegments();

  // init the inputelement
  if (! window.step2OffsetInserted ) {
    const SW = window.cocoMovingBoundingBoxPolygon!.getBounds()!.getSouthWest();
    cocoMapSetup.inputElement.value = `${SW.lat()},${SW.lng()}`;
  }

  /** END of setup on page load
   * ======= ======= ======= ======= ======= ======= =======
   * ======= ======= ======= ======= ======= ======= =======
   * ======= ======= ======= ======= ======= ======= =======
   */










  /**
   * ======= APPLY drag listeners. ======= for moving bounding box  =======
   * The user can drag the bouding box and all segments move with it.
   * The SE point of the bounding box is saved in the DB using the input element of the map.
   * We use that new SE point to find the offset, by comparing with the original SE point by Solar API
   */
  if (!window.cocoMovingBoundingBoxPolygon) {
    return;
  }
  // Add drag listeners to the Moving Bounding Box
  google.maps.event.addListener(window.cocoMovingBoundingBoxPolygon, 'drag', () => {
    console.log('Dragging the Moving Bounding Box...');

    // apply the displacement of the moving boundign box to all segments, as we drag
    updateValuesCoordsSegmentsWithOffset();

    // repaint all segments with a new style while dragging
    setupSegments(false);
    cocoMapSetup.segments?.forEach( segm => {
      segm.setOptions({ strokeColor: 'white', strokeWeight: 1, strokeOpacity: 1});
    } );
  });

  google.maps.event.addListener(window.cocoMovingBoundingBoxPolygon, 'dragend', () => {

    // Update the values of the segments based on the new position of the bounding box
    // (not really needed as they where updated in the 'drag', but we update the style)
    setupSegments();

    // save the new value in the input. It will be used to calculate offset in the next field
    const SW = window.cocoMovingBoundingBoxPolygon!.getBounds()!.getSouthWest();
    cocoMapSetup.inputElement.value = `${SW.lat()},${SW.lng()}`;
  });


} );


/** ================ ================ ================ ================
 *
 *  End of applying listeners handlers
 *
 *  ================ ================ ================ ================ */



export default getStep2CocoMapSetup;