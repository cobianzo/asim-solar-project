/**
 * This is a drag, but I need to mock the types
 * that I use in my testings.
 */

global.google = {
	maps: {
		Point: class {
			x: number;
			y: number;
			constructor(x: number, y: number) {
				this.x = x;
				this.y = y;
			}
		},
		LatLng: class {
			latValue: number;
			lngValue: number;
			constructor(lat: number, lng: number) {
				this.latValue = lat;
				this.lngValue = lng;
			}
			lat() {
				return this.latValue;
			}
			lng() {
				return this.lngValue;
			}
		},
		// Agrega aquí más mocks según los necesites
	},
} as any;
