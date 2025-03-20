/**
 * === In step 3 mostly, but also called in step 2 ===
 * All these functions are related to the step 2, setting up the map
 * to paint the segments over the building and assign the listeners to
 * interact with them.
 */

// types
import { ExtendedSegment, RoofSegmentStats, SelectRotationPortraitSegmentsOptions } from './types';


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
  removeRectangleInMap,
  paintSegment,
  MARKER_DOT,
  deleteMarkersCompletely,
 } from './drawing-helpers';

import { createPopup, highlightSegmentInfo, resetSegmentsInfo } from './debug';
import { getCurrentStepCocoMap } from '.';
import { getStep3CocoMapSetup } from './step3_functions';
import { createSaveSegmentButton, createUnselectSegmentButton } from './buttons-unselect-save-rectangle';
import setupRectangles, { highlightSavedRectangle, unhighlightSavedRectangle, handlerFirstClickDrawRectangleOverSegment, getRectangleBySegment, handlerSecondClickDrawRectangle, RECTANGLE_OPTIONS, FADED_RECTANGLE_OPTIONS, removeSavedRectangleBySegmentIndex } from './setup-rectangle-interactive'

// colours of the polygons
export const SEGMENT_DEFAULT: google.maps.PolygonOptions = {
  fillColor: 'red',
  fillOpacity: 0.4,
  strokeColor: 'black',
  strokeWeight: 0,
  clickable: true
}

export const SEGMENT_WHEN_RECTANGLE: google.maps.PolygonOptions = {
  ...SEGMENT_DEFAULT,
  fillOpacity: 0.1,
  strokeWeight: 1,
  strokeOpacity: 0.5,
  clickable: true
}

export const SEGMENT_HOVER: google.maps.PolygonOptions = {
  fillOpacity: 0.8,
}
export const SEGMENT_HOVER_WHEN_RECTANGLE: google.maps.PolygonOptions = {
  strokeWeight: 5
}
export const SEGMENT_SELECTED: google.maps.PolygonOptions = {

}
export const SEGMENT_SELECTED_WHEN_RECTANGLE: google.maps.PolygonOptions = {

}


/**
 * Initializes and sets up the roof segments for the map.
 * Retrieves and processes the roof segments data, calculates
 * the necessary coordinates and angles for rendering on the map,
 * and binds event listeners for interaction with the segments.
 *
 * This uses the exposed js vars set up in class-hooks.php
 */
const setupSegments = (
  rotationSegments: SelectRotationPortraitSegmentsOptions = 'no-extra-rotation',
  paintSunMarkers = true
 ) => {

  const cocoMapSetup = getCurrentStepCocoMap();
  if ( ! cocoMapSetup ) {
    console.log(`:Not found the coco-map in page ${window.gf_current_page}. Early exit`, cocoMapSetup);
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
      cleanupAssociatedMarkers( segment as unknown as AssociatedMarkersParent );
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

  if ( roofSegments.length ) {
    roofSegments.forEach((element : RoofSegmentStats, i: number) => {
      console.log( 'Calculos par segment ', i, element);

      const {center, azimuthDegrees, boundingBox: {sw, ne}} = element;

      // Early exit if any required property is undefined
      if (!center || azimuthDegrees === undefined || !sw || !ne) {
        console.error('Missing required segment data. Skipping segment:', { center, azimuthDegrees, sw, ne });
        return;
      }


      // based on sw and ne, get the full rectangle
      // aligned with North
      const rectPoints = orthopedicRegtanglePoints(theMap, sw, ne);

      if ( ! rectPoints ) {
        return null;
      }

      // is higher than wider?
      const isPortrait = rectPoints ?
        Math.abs(rectPoints[0].x - rectPoints[2].x) < Math.abs(rectPoints[0].y - rectPoints[1].y)
        : false;

      // angle that we'll turn the drwan rectangle
      // here the API of gmaps is weird: if the rectangle is landscape, the angle is correct,
      // but if the rectangle is portrait, we need to add 90 degrees to the angle (still verifying that)
      let realAngleRotation = azimuthDegrees;
      switch ( rotationSegments ) {
        case 'no-rotation-at-all': realAngleRotation = 0; break; // not in use
        case 'no-extra-rotation': break;
        case 'rotate-90-only-portrait':
          realAngleRotation += isPortrait ? 90 : 0; break;
        default: break;
      }
      const newRectPoints = rotateRectangle(rectPoints, realAngleRotation);
      const rectangleToPaint = newRectPoints? convertPointsArrayToLatLngString(theMap, newRectPoints) : null;
      if (!rectangleToPaint || rectangleToPaint.includes('NaN')) {
        console.error('we coudlnt calculate the coords to paint the segment', rectangleToPaint, newRectPoints);
        return;
      }

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
      const segment = paintSegment(theMap, rectangleToPaint);

      segment.data = element; // to access to the solar API data of the segment
      segment.indexInMap = i;

      if (paintSunMarkers) {
        paintASunForSegment(theMap, segment, `sun-marker${isPortrait? '-hover':''}.png` ).then( sunMarker => {
          addAssociatedMarker(sunMarker, segment as unknown as AssociatedMarkersParent);
        });
      }
      window.paintAMarker( theMap, segment.getPath().getArray()[0], `${window.cocoAssetsDir}${'pixel.png'}`, MARKER_DOT)
        .then(m => addAssociatedMarker(m, segment as unknown as AssociatedMarkersParent))

      segment.realRotationAngle = realAngleRotation;
      segment.isPortrait = isPortrait;

      cocoMapSetup.segments.push( segment );

      resetSegmentVisibility(segment); // if the segment has rectangle the visibility needs update.

      // Add Listeners to the segment
      activateInteractivityOnSegment(segment);
    });


    // if there are rectangles designed by the user, paint them
    setupRectangles();

  } // end of painting the segments.
}

// handlers
function handlerMouseOverHighlightSegment (this: ExtendedSegment, e: Event) {
  const segment: ExtendedSegment = this;
  const cocoMapSetup = getStep3CocoMapSetup();
  if ( ! cocoMapSetup ) {
    console.error(`Not found the coco-map of step 3 . Early exit`, cocoMapSetup);
    return;
  }

  console.log('hover on roof segment', segment);
  highlightSegment(segment);
  highlightSavedRectangle(segment);
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
  const cocoMapSetup = getStep3CocoMapSetup();
  if ( ! cocoMapSetup ) {
    console.error(`Not found the coco-map of step 3--. Early exit`, cocoMapSetup);
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
  unhighlightSavedRectangle(segment);
  resetSegmentsInfo(); // debug purposes
  // hide all other segments .
  if (cocoMapSetup?.segments?.length)
    cocoMapSetup.segments.forEach((segm) => resetSegmentVisibility(segm));
}

function handlerClickSelectSegment(this: ExtendedSegment, e: Event) {
  // init vars
  const segm: ExtendedSegment = this;
  const cocoMapSetup = getStep3CocoMapSetup();
  if ( ! cocoMapSetup ) {
    console.error(`:Not found the coco-map of step 3 Early exit`, cocoMapSetup);
    return;
  }

  // unhighlight all segments
  const allSegments = window.cocoMaps[window.step3CocoMapInputId].segments;
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


  createUnselectSegmentButton(segm.map, 'Unselect');
  // if the segment had a rectangle, we automatically select the rectangle,
  // so with the buttons  can save it or delete ir
  if ( getRectangleBySegment(segm) ) {
    createSaveSegmentButton(segm.map);
  }

  window.cocoDrawingRectangle = window.cocoDrawingRectangle || {};
  window.cocoDrawingRectangle.selectedSegment = segm;
  delete window.cocoDrawingRectangle.hoveredSegment;

  ['click', 'mouseover', 'mouseout', 'mousemove'].forEach(eventName => {
    google.maps.event.clearListeners(segm, eventName);
    google.maps.event.clearListeners(segm.map, eventName);
  });


  const rectangleInfo = getRectangleBySegment(segm);

  // hide all other rectangles, they are not being edited
  window.cocoSavedRectangles?.forEach( r => {
    if (rectangleInfo?.segmentIndex !== r.segmentIndex) {
      console.log( ' >>> hiding: ', rectangleInfo, rectangleInfo?.segmentIndex)
      r.polygon?.setOptions(FADED_RECTANGLE_OPTIONS);
    }
  } );

  // If the segment has already a saved rectangle associated, we select that rectangle
  // NOTE: we could allow having more than one rectangle per segment. For that we would not
  // select the rectangle just yet, but add a click event for the rectangles of this segment first.
  if (rectangleInfo?.polygon) {

    // we make the rectangle editable. It's up to the user now to save it or delete it with the buttons
    window.cocoDrawingRectangle.polygon = rectangleInfo.polygon;
    handlerSecondClickDrawRectangle();

  } else {

    // this makes that the user starts painting the rectangle at the same time that he selects the segment
    // handlerFirstClickDrawRectangleOverSegment(e);
    // this, on the other hand, amkes that the user needs to click again on the segment to start painting the rectangle
    google.maps.event.addListener(segm, 'click', handlerFirstClickDrawRectangleOverSegment);

  }

}

/** Add the three handlers to the segment  */
export const activateInteractivityOnSegment = (segment: ExtendedSegment) => {
  if (!window.cocoIsStepSelectRectangle) return;
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

export const addAssociatedMarker = (marker: AdvancedMarkerElement, parent: AssociatedMarkersParent) => {
  parent.associatedMarkers ||= [];
  parent.associatedMarkers.push(marker);
};

export const cleanupAssociatedMarkers = ( parent: AssociatedMarkersParent) => {
  parent.associatedMarkers ||= [];
  deleteMarkersCompletely(parent.associatedMarkers);
  parent.associatedMarkers = [];
};


export default setupSegments;