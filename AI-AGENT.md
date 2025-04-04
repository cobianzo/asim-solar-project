Estoy trabajando en un proyecto en entorno de WordPress wp-env. 
Lo guardo todo en un repo de git.
Usa las dependencias del plugin gravity forms, que ya está incluido en el repo.
Tiene la dependencia de mi otro plugin, que es repo incluido como un submodulo.
Y en él desarrolo mi nuevo plugin llamado solar-project.
Este es parte del wp-env.json
"plugins": [
    ".",
    "./plugins/coco-gravity-form-map-field",
    "./plugins/solar-project",
    "./plugins/gravityforms",
    "https://downloads.wordpress.org/plugin/wordpress-importer.latest-stable.zip"
  ],

Quiero que tenga PHPUnit, Playwright para e2e.
El plugin usa una form de Gravity Forms con 3 Pages. Mi plugin dependiente coco-gravity-form-map-field es un addon de Gravity Forms que permite insertar un campo de Google Maps donde se salvan las coordenadas latitud,longitud como un string.
Te puedo dar el readme.md para más info.

  Mi proyecto trabaja mucho con typescript, compilado de /src/index.ts a build/index.js.
  Tengo que hacer muchas funciones trigonométricas, sobre todo en ts.
  Quiero hacer tests unitarios para mis funciones en ts. Cómo me recomiendas empezar?
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





