Estoy trabajando en un proyecto en entorno de WordPress wp-env. 
Lo guardo todo en un repo de git. https://github.com/cobianzo/asim-solar-project
Tiene la dependencia de mi otro plugin, que es repo incluido como un submodulo ( https://github.com/cobianzo/coco-gravity-form-map-field ) .
Este es parte del wp-env.json, aqui puedes ver las dependencias
"plugins": [
    ".", # este plugin es irrelevante, en el podria incluir algunas herramientas para testing, nada mas.
    "./plugins/coco-gravity-form-map-field",
    "./plugins/solar-project",  # este es el desarrollo de mi plugin
    "./plugins/gravityforms"
  ],
"env": {
	"development": {
		"port": 8777
	},
	"tests": {
		"port": 8889
	}
}

Quiero que tenga PHPUnit, Playwright para e2e.
El plugin usa una form de Gravity Forms con 3 Pages. 
Mi plugin dependiente coco-gravity-form-map-field es un addon de Gravity Forms que permite insertar un campo de Google Maps donde se salvan las coordenadas latitud,longitud como un string.
Te puedo dar el readme.md para más info.

  Mi proyecto trabaja mucho con typescript, compilado de /src/index.ts a build/index.js.
  Tengo que hacer muchas funciones trigonométricas, sobre todo en ts.
  Quiero hacer tests unitarios para mis funciones en ts.
  Por ejemplo quiero testear esta funcion unitaria:
  /**
  * Given a polygon defined by Array<google.maps.Point>, y returns the
  * Array<google.maps.Point> after rotating the polygon `angleDegrees`
  * @param vertices
  * @param center
  * @param angleDegrees
  * @returns
  */
  export const rotateRectangle = (
    vertices: Array<google.maps.Point>,
    center: google.maps.Point,
    angleDegrees: number
  ): Array<google.maps.Point> => {
    const angleRadians = (angleDegrees * Math.PI) / 180;

    return vertices.map(vertex => {
      // Trasladar el vértice al origen
      const translatedX = vertex.x - center.x;
      const translatedY = vertex.y - center.y;

      // Aplicar la rotación
      const rotatedX =
        translatedX * Math.cos(angleRadians) -
        translatedY * Math.sin(angleRadians);
      const rotatedY =
        translatedX * Math.sin(angleRadians) +
        translatedY * Math.cos(angleRadians);

      // Trasladar el vértice de nuevo al centro especificado
      const newX = rotatedX + center.x;
      const newY = rotatedY + center.y;

      return new google.maps.Point(newX, newY);
    });
  };





./plugins
├── coco-gravity-form-map-field (Dependency, addon of GF. It's a git repo on itself)
├── gravityforms (Dependency)
└── solar-project (The main plugin itself)
    ├── assets
    │   ├── notifications
    │   │   └── segmentInfo.html : We load with ajax this template to show the popup with info about a segment
    ├── bin
    ├── inc (The PHP action is here)
    │   ├── api (calls to external APIs, in this case Google Solar API and Google MAPS)
    │   │   ├── class-API.php
    │   │   ├── class-google-maps-api.php
    │   │   └── class-solar-api.php
    │   ├── class-enqueue.php (We enqueue our code created in /src, and also expose vars in JS here)
    │   ├── class-gravity-hooks.php (hooks to modify fields layout and values)
    │   ├── class-gravity-model-panel.php (there in a CPT called panel. We list it in a dropdown in step 3)
    │   ├── class-helper.php (reusing functions)
    │   ├── class-model-panel.php (the CPT panel)
    │   ├── class-notifications.php (we show notification as a topbar and also as popups)
    │   └── render-step-4.php (the last step can be done completely with PHP, showing the final report)
    ├── package.json
    ├── solar-project.php
    ├── src (All the js -typescript- happens here)
    │   ├── advancedgooglemarker.types.d.ts
    │   ├── buttons-topright-map.ts
    │   ├── command-rotate-portrait-segments.ts
    │   ├── debug.ts
    │   ├── drawing-helpers.ts
    │   ├── index.ts
    │   ├── notification-api.ts
    │   ├── setup-drag-all-segments-interaction.ts
    │   ├── setup-rectangle-interactive.ts
    │   ├── setup-resize-rectangle-interaction.ts
    │   ├── setup-segments-interactive-functions.ts
    │   ├── setup-solar-panels.ts
    │   ├── step1_functions.ts
    │   ├── step2_functions.ts
    │   ├── step3_functions.ts
    │   ├── step4_functions.ts
    │   ├── style.css
    │   ├── trigonometry-helpers.ts
    │   ├── types.d.ts
    │   └── unit-tests
    │       ├── mocks
    │       │   └── googleMapsMock.ts
    │       └── trigonometry-helpers.test.ts
    └── tsconfig.json
