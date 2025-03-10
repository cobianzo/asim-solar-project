document.addEventListener("solarMapReady", function (event) {

  if ( ! window.cocoIsStepSelectPanelli ) {
    return;
  }

  const cocoMapSetup = event.detail
  if ( window.step3PolygonInputId !== cocoMapSetup.inputElement.id ) {
    console.error( 'not found the input id', cocoMapSetup.inputElement );
    return;
  }
  alert('we are in step 3: ' + window.step2RectangleCoords);

  // convert the coords window.step2RectangleCoords
  window.paintAPoygonInMap(cocoMapSetup.map, window.step2RectangleCoords, { fillOpacity: 0.35 });

});