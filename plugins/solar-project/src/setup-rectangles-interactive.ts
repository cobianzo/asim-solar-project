/**
 * The use defines rectangles where the solar panels go.
 * There is one rectangle per segment
 *
 * The rectangles can be selected and edited.
 * When edited the info of the edited rectangle is in window.cocoDrawingRectangle
 *
 * The created rectangles are in window.cocoSavedRectangles
 *
 */

import { getStep3CocoMapSetup } from "./step3_functions";
import { ExtendedSegment } from "./types";

const RECTANGLE_OPTIONS = {
  strokeColor: 'black',
  fillColor:'blue',
  zIndex: 0
}
const HIGHLIGHTED_RECTANGLE_OPTIONS = {
  strokeColor: 'yellow',
  fillColor:'yellow',
  zIndex: 10000
}


/** paint the rectangles and make them selectables */
const setupRectangles = function() {

  const cocoMapSetup = getStep3CocoMapSetup();
  if (! cocoMapSetup?.map ) {
    return;
  }

  const allSavedRectangles = window.cocoSavedRectangles || [];
  allSavedRectangles.forEach(r => {
    if (!r.tempPathAsString?.length) return;
    if (!r.polygon?.getMap()) {
      r.polygon = window.paintAPoygonInMap(
        cocoMapSetup.map,
        r.tempPathAsString,
        RECTANGLE_OPTIONS
      );
    }

  });


}

export const selectRectangle = function( indexInSavedRectangles: number ) {

}

export const hideAllRectangles = function() {}

export const showAllRectangles = function() {}

export const highlightSavedRectangle = function(segm: ExtendedSegment) {
  // find the rectangle associated to this segment
  const rectangle = (window.cocoSavedRectangles || []).find(
    (r) => r.segmentIndex === segm.indexInMap
  );

  if (rectangle && rectangle.polygon) {
    rectangle.polygon.setOptions(HIGHLIGHTED_RECTANGLE_OPTIONS);
  }
}

export const unhighlightSavedRectangle = function(segm: ExtendedSegment) {
  // find the rectangle associated to this segment
  const rectangle = (window.cocoSavedRectangles || []).find(
    (r) => r.segmentIndex === segm.indexInMap
  );

  if (rectangle && rectangle.polygon) {
    rectangle.polygon.setOptions(RECTANGLE_OPTIONS);
  }
}



export default setupRectangles;