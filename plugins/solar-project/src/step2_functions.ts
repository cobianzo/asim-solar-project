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
import {setupSegmentsAndDraggableBoundingBox, updateValuesCoordsSegmentsWithOffsetAsPerFormCompletion} from './setup-drag-all-segments-interaction';
import { moveGoogleMapsRectangleToCenter } from './trigonometry-helpers';


/**
 * Returns the CocoMapSetup object for the step2 map (the one with the input text element
 * identified by window.step2CocoMapInputId). The default export of this script
 *
 * @returns {CocoMapSetup | null}
 */
const getStep2CocoMapSetup = () : CocoMapSetup | null => {
  const cocoMapSetup = window.cocoMaps[window.step2CocoMapInputId];
  return cocoMapSetup ?? null;
}

/** Start everything  */

document.addEventListener("solarMapReady" as keyof DocumentEventMap, (event: Event) => {

  // setup and validations
  const customEvent = event as CustomEvent<CocoMapSetup>;
  const cocoMapSetup = getStep2CocoMapSetup();
  if ( ! window.cocoIsStepSelectOffset || ! cocoMapSetup
    || ( cocoMapSetup.inputElement.id !== customEvent.detail.inputElement.id )
  ) {
    return;
  }

  console.log(' Exectued cocoMap for field', window.cocoMapSetup);
  const theMap = cocoMapSetup.map;

  /**  ================ ================ ================ ================
   *
   *  PAINTS THE PROFILE OF THE BUILDING. The data has been exposed with PHP.
   *  ================ ================ ================ ================*/
  // design polygon of the whole roof profile (todelete, it does not always work)
  if (window.cocoBuildingProfile?.length) {
    paintPolygonsByArrayOfStrings(theMap, window.cocoBuildingProfile, { strokeColor: 'black' });
  }

  // on page load we save the original position of all segments in coco `Segments Original First Vertex`
  // Paint the Bounding Box the first time.

  /**
   * =======
   */
  // Paint Moving Bounding box according t sw ne values
  window.cocoMovingBoundingBoxPolygon = paintBoundingBoxAsRectangle(window.cocoOriginalBoundingBox);

  // move the MovingBoundingBox if we have some offset already in the db.
  // verification sw ne:
  const deviation = (window.cocoOriginalBoundingBox.ne.longitude - window.cocoMovingBoundingBoxPolygon!.getBounds()!.getNorthEast().lng())
      + (window.cocoOriginalBoundingBox.ne.latitude - window.cocoMovingBoundingBoxPolygon!.getBounds()!.getNorthEast().lat())
      + (window.cocoOriginalBoundingBox.sw.latitude - window.cocoMovingBoundingBoxPolygon!.getBounds()!.getSouthWest().lat())
      + (window.cocoOriginalBoundingBox.sw.longitude - window.cocoMovingBoundingBoxPolygon!.getBounds()!.getSouthWest().lng());
  if (deviation !== 0) {
    alert('error in placing rect.');
  } else {
    console.log('>>>>> Rect well placed!!!');
  }

  /**
   * =======
   */


  // on page load, we paint the bounding box, and if the input had a value
  //  we initialize the Moving Bounding Box to that value
  // updateValuesCoordsSegmentsWithOffsetAsPerFormCompletion();


  // Create the segments and the bounding box to drag them
  // setupSegmentsAndDraggableBoundingBox();




} );


/** ================ ================ ================ ================
 *
 *
 *
 *  ================ ================ ================ ================ */



export default getStep2CocoMapSetup;