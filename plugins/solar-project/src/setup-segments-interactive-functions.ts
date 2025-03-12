/**
 * All these functions are related to the step 2, setting up the map
 * to paint the segments over the building and assign the listeners to
 * interact with them.
 */

// types
import { ExtendedSegment, RoofSegmentStats } from './types';

// internal dependencies, trigonometrical functions
import {
  orthopedicRegtanglePoints,
  latLngToPoint,
  rotateRectangle,
  convertPointsArrayToLatLngString,
} from './trigonometry-helpers';

// internal dependencies, paiting on the map
import {
  paintASunForSegment,
  highlightSegment,
  resetSegmentVisibility,
  fadeSegment,
  createUnselectSegmentButton,
  removeRectangleInMap,
 } from './drawing-helpers';

import { createPopup, highlightSegmentInfo, resetSegmentsInfo } from './debug';
import getStep2CocoMapSetup, { handlerFirstClickDrawRectangleOverSegment } from './step2_functions';

/**
 * Initializes and sets up the roof segments for the map.
 * Retrieves and processes the roof segments data, calculates
 * the necessary coordinates and angles for rendering on the map,
 * and binds event listeners for interaction with the segments.
 *
 * This uses the exposed js vars set up in class-hooks.php
 */
const setupSegments = ( rotationSegments: 'no-rotation-at-all' | 'no-extra-rotation' | 'rotate-90-only-portrait' | 'rotate-all' = 'no-extra-rotation' ) => {

  const cocoMapSetup = getStep2CocoMapSetup();
  if ( ! cocoMapSetup ) {
    console.log(`Not found the coco-map of step 2 in page ${window.gf_current_page}. Early exit`, cocoMapSetup);
    return;
  }

  const { map: theMap } = cocoMapSetup as { map: google.maps.Map };

  // retrieve the segments to. In a just-loaded page, they won't exist yet.
  const segments: ExtendedSegment[] = cocoMapSetup.segments? cocoMapSetup.segments : [];

  /** ========================================
   * RESET THINGS, IF THEY EXISTED ALREADY
   * ========================================*/

  // reset the SEGMENTS polygons, deleting them if they exist
  if ( segments.length ) {
    segments.forEach( (segment: ExtendedSegment) => {
      deactivateInteractivityOnSegment(segment);
      segment.setMap(null);
    } );
    cocoMapSetup.segments = [];
  }

  // If the rectangle by the user was painted, we delete it and we clear all info stored about its creation
  removeRectangleInMap(theMap, true);

  /** ========================================  
   * PAINT THE SEGMENTS
   * ========================================*/

  // get the info of the segments and paint them, one by one
  const roofSegments = window.cocoBuildingSegments;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // @ts-ignore
  if ( roofSegments.length ) {
    roofSegments.forEach((element : RoofSegmentStats, i: number) => {
      console.log( 'Calculos par segment ', i, element);

      const {center, azimuthDegrees, boundingBox: {sw, ne}} = element;

      // calculations of coord of the new rotated rect
      const rectPoints = orthopedicRegtanglePoints(theMap, sw, ne);

      if ( ! rectPoints ) {
        return null;
      }

      const isPortrait = rectPoints ?
        Math.abs(rectPoints[0].x - rectPoints[2].x) < Math.abs(rectPoints[0].y - rectPoints[1].y)
        : false;

      // angle that we'll turn the drwan rectangle
      // here the API of gmaps is weird: if the rectangle is landscape, the angle is correct,
      // but if the rectangle is portrait, we need to add 90 degrees to the angle (still verifying that)
      let realAngleRotation = azimuthDegrees;
      switch ( rotationSegments ) {
        case 'no-rotation-at-all': realAngleRotation = 0; break;
        case 'no-extra-rotation': break;
        case 'rotate-90-only-portrait':
          realAngleRotation += isPortrait ? 90 : 0; break;
        case 'rotate-all':
          realAngleRotation += 90; break;
      }

      const centerPoint = latLngToPoint(theMap, center);
      const newRectPoints = centerPoint? rotateRectangle(rectPoints, centerPoint, realAngleRotation) : null;
      const rectangleToPaint = newRectPoints? convertPointsArrayToLatLngString(theMap, newRectPoints) : null;
      console.log('rectangleToPaint', rectangleToPaint);

      // Finally paint the inclined rectangle, adding some properties for easy access
      if (cocoMapSetup) {
        cocoMapSetup.segments = cocoMapSetup.segments || [];
      } else {
        console.error('cocoMapSetup is not initialized. Early exit', cocoMapSetup);
        return null;
      }

      // add extra data to the segment so we can manipulate it better.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const segment = window.paintAPoygonInMap(theMap, rectangleToPaint, { clickable: true, fillOpacity: 0.35, fillColor: '#FF0000' });
      segment.data = element; // to access to the solar API data of the segment
      segment.indexInMap = i;
      segment.pointsInMap = newRectPoints || undefined;
      paintASunForSegment(theMap, segment, `sun-marker${isPortrait? '-hover':''}.png` ).then( sunMarker => {
        segment.sunMarker = sunMarker;
      });
      segment.realRotationAngle = realAngleRotation;
      segment.isPortrait = isPortrait;

      cocoMapSetup.segments.push( segment );

      // Add Listeners to the segment
      activateInteractivityOnSegment(segment);
    });

  } // end of painting the segments.
}


// handlers
function handlerMouseOverHighlightSegment (this: ExtendedSegment, e: Event) {
  const segment: ExtendedSegment = this;
  const cocoMapSetup = getStep2CocoMapSetup();
  if ( ! cocoMapSetup ) {
    console.error(`Not found the coco-map of step 2 in page handlerMouseOverHighlightSegment. Early exit`, cocoMapSetup);
    return;
  }

  console.log('hover on roof segment', segment);
  highlightSegment(segment);
  highlightSegmentInfo(segment); // debug info highlighted.
  // eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/ban-ts-comment
  // @ts-ignore

  window.cocoDrawingRectangle = window.cocoDrawingRectangle || {};
  window.cocoDrawingRectangle.hoveredSegment = segment;

  // hide all other segments
  cocoMapSetup.segments?.forEach((segm: ExtendedSegment) => {
    if ( segm.indexInMap !== segment.indexInMap ) {
      fadeSegment(segm);
    }
  })
}

const handlerMouseOutUnhighlightSegment = function(this: ExtendedSegment, e: Event) {
  // init things
  const segment: ExtendedSegment  = this;
  const cocoMapSetup = getStep2CocoMapSetup();
  if ( ! cocoMapSetup ) {
    console.error(`Not found the coco-map of step 2 in page handlerMouseOverHighlightSegment. Early exit`, cocoMapSetup);
    return;
  }
  // verifications
  if ( window.cocoDrawingRectangle?.hoveredSegment?.indexInMap !== segment.indexInMap
    || window.cocoDrawingRectangle?.selectedSegment?.indexInMap === segment.indexInMap
  ) {
    return;
  }

  // the action
  window.cocoDrawingRectangle.hoveredSegment = undefined;
  resetSegmentVisibility(segment);
  resetSegmentsInfo(); // debug purposes
  // hide all other segments .
  if (cocoMapSetup?.segments?.length)
    cocoMapSetup.segments.forEach((segm) => resetSegmentVisibility(segm));
}

function handlerClickSelectSegment(this: ExtendedSegment, e: Event) {
  // init vars
  const segm: ExtendedSegment = this;
  const cocoMapSetup = getStep2CocoMapSetup();
  if ( ! cocoMapSetup ) {
    console.error(`Not found the coco-map of step 2 in page handlerMouseOverHighlightSegment. Early exit`, cocoMapSetup);
    return;
  }

  // unhighlight all segments
  const allSegments = window.cocoMaps[window.step2PolygonInputId].segments;
  allSegments?.forEach( (s: ExtendedSegment) => {
    if ( s.indexInMap !== segm.indexInMap ) {
      s.setVisible(false);
    }
    resetSegmentVisibility(s);
  } );
  highlightSegment(segm, { fillColor: 'green', fillOpacity: 0.5, strokeWeight: 5, draggableCursor: 'crosshair'  }); // green

  // Debugging: show popoover info
  const popoverInfo = document.getElementById(`segment-info-${segm.indexInMap}`);
  if (popoverInfo) {
    createPopup(popoverInfo);
  }

  const unselectButton = createUnselectSegmentButton(segm.map);
  unselectButton.onclick = () => {

    // rebuild all the segments
    setupSegments();

    unselectButton.remove();

    // debug action, remove the info of the segment
    const popupInfoDebug = document.getElementById('popup-info');
    if (popupInfoDebug) popupInfoDebug.remove();
  };

  window.cocoDrawingRectangle = window.cocoDrawingRectangle || {};
  window.cocoDrawingRectangle.selectedSegment = segm;
  delete window.cocoDrawingRectangle.hoveredSegment;

  ['click', 'mouseover', 'mouseout', 'mousemove'].forEach(eventName => {
    google.maps.event.clearListeners(segm, eventName);
    google.maps.event.clearListeners(segm.map, eventName);
  });

  // this makes that the user starts painting the rectangle at the same time that he selects the segment
  // handlerFirstClickDrawRectangleOverSegment(e);
  // this, on the other hand, amkes that the user needs to click again on the segment to start painting the rectangle
  google.maps.event.addListener(segm, 'click', handlerFirstClickDrawRectangleOverSegment);
}


export const activateInteractivityOnSegment = (segment: ExtendedSegment) => {
  segment.addListener('mouseover', handlerMouseOverHighlightSegment );
  google.maps.event.addListener(segment, 'mouseout', handlerMouseOutUnhighlightSegment ) ;
  google.maps.event.addListener(segment, 'click', handlerClickSelectSegment);
}
export const deactivateInteractivityOnSegment = (segm: ExtendedSegment) => {
  ['click', 'mouseover', 'mouseout', 'mousemove'].forEach(eventName => {
    google.maps.event.clearListeners(segm, eventName);
    google.maps.event.clearListeners(segm.map, eventName);
  });
}



export default setupSegments;