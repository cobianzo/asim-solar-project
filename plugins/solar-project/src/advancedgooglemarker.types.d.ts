interface AdvancedMarkerElementOptions {
  map?: google.maps.Map | null; // Mapa al que se asocia el marcador
  position: google.maps.LatLng | google.maps.LatLngLiteral; // Posición del marcador
  title?: string; // Título del marcador
  content?: HTMLElement | null; // Contenido personalizado del marcador
}

interface AdvancedMarkerElement {
  map: google.maps.Map | null; // Mapa al que está asociado el marcador
  position: google.maps.LatLng | google.maps.LatLngLiteral; // Posición del marcador
  title: string; // Título del marcador
  content: HTMLElement | null; // Contenido personalizado del marcador

  // Métodos (si los hay)
  addListener(eventName: string, handler: Function): google.maps.MapsEventListener;
  setPosition(position: google.maps.LatLng | google.maps.LatLngLiteral): void;
  setMap(map: google.maps.Map | null): void; // Alternativa a la propiedad `map`
}

interface AssociatedMarkersParent extends Record<string, any> {
  associatedMarkers: AdvancedMarkerElement[];
}