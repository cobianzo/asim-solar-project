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
import {getOffsetFromOriginBoundingBox, getOffsetFromValueInDB, setupSegmentsAndDraggableBoundingBox, updateValuesCoordsSegmentsWithOffset, updateValuesCoordsSegmentsWithOffsetAsPerFormCompletion} from './setup-drag-all-segments-interaction';
import { moveGoogleMapsRectangleToCenter } from './trigonometry-helpers';
import setupSegments, { cleanupAssociatedMarkers, deactivateInteractivityOnSegment } from './setup-segments-interactive-functions';


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


  /**
   * Particular case. This is not the first time we visit this page, and the value of
   * the offset has been previouly inserted, and accessible in the DB
   */
  if ( window.step2OffsetInserted ) {
    const [offsetLat, offsetLng] = getOffsetFromValueInDB();
    const newSWNE =
    {
      sw: { latitude: window.cocoOriginalBoundingBox.sw.latitude + offsetLat, longitude: window.cocoOriginalBoundingBox.sw.longitude + offsetLng },
      ne: { latitude: window.cocoOriginalBoundingBox.ne.latitude + offsetLat, longitude: window.cocoOriginalBoundingBox.ne.longitude + offsetLng },
    };
    window.cocoMovingBoundingBoxPolygon!.setBounds({
      south: newSWNE.sw.latitude,
      west: newSWNE.sw.longitude,
      north: newSWNE.ne.latitude,
      east: newSWNE.ne.longitude,
    });

    // update the source of truth for the position of the segments.
    // So weverytime we build them we'll apply the offset set up by the user
    updateValuesCoordsSegmentsWithOffset();

  }
  // verification sw ne:
  // const deviation = (window.cocoOriginalBoundingBox.ne.longitude - window.cocoMovingBoundingBoxPolygon!.getBounds()!.getNorthEast().lng())
  //     + (window.cocoOriginalBoundingBox.ne.latitude - window.cocoMovingBoundingBoxPolygon!.getBounds()!.getNorthEast().lat())
  //     + (window.cocoOriginalBoundingBox.sw.latitude - window.cocoMovingBoundingBoxPolygon!.getBounds()!.getSouthWest().lat())
  //     + (window.cocoOriginalBoundingBox.sw.longitude - window.cocoMovingBoundingBoxPolygon!.getBounds()!.getSouthWest().lng());
  // if (deviation !== 0) {
  //   alert('error in placing rect.');
  // } else {
  //   console.log('>>>>> Rect well placed!!!');
  // }

  setupSegments();

  // init the inputelement
  if (! window.step2OffsetInserted ) {
    const SW = window.cocoMovingBoundingBoxPolygon!.getBounds()!.getSouthWest();
    cocoMapSetup.inputElement.value = `${SW.lat()},${SW.lng()}`;
  }

  /**
   * ======= APPLY drag listeners
   */
  if (!window.cocoMovingBoundingBoxPolygon) {
    return;
  }
  // Add drag listeners to the Moving Bounding Box
  google.maps.event.addListener(window.cocoMovingBoundingBoxPolygon, 'drag', () => {
    console.log('Dragging the Moving Bounding Box...');
    // Get the offset of the current bounding box. Let's compare the original SW position adn the current
    const [offsetLat, offsetLng] = getOffsetFromOriginBoundingBox();

    // apply that offset to all segments
    cocoMapSetup.segments?.forEach( segm => {
      updateValuesCoordsSegmentsWithOffset();
    } );

    // repaint all segments
    setupSegments(false);
    cocoMapSetup.segments?.forEach( segm => {
      segm.setOptions({ strokeColor: 'white', strokeWeight: 1, strokeOpacity: 1});
    } );
  });

  google.maps.event.addListener(window.cocoMovingBoundingBoxPolygon, 'dragend', () => {
    console.log('Finished dragging the Moving Bounding Box.');
    // Update the values of the segments based on the new position of the bounding box
    setupSegments();

    // save the new value in the input. It will be user to calculate offset in the next field
    const SW = window.cocoMovingBoundingBoxPolygon!.getBounds()!.getSouthWest();
    cocoMapSetup.inputElement.value = `${SW.lat()},${SW.lng()}`;
  });


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