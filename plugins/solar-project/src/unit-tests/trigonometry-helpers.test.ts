import { convertPointsArrayToLatLngString, getCenterByVertexPoints, getRectangleInclinationByPoints, rotateRectangle, scaleRectangleByPoints } from "../trigonometry-helpers";
// import { otraFuncionTrigonometrica } from "../../src/otraFuncion";

describe("Testing an inclined rectangle", () => {

  let inclinedRect: google.maps.Point[];
  let rightRect: google.maps.Point[];


  beforeEach(() => {
    // inclinacion de 66 grados
    /*                          x,y
    |    •
    |             •
    | •
    |          • <----------------- first vertex
    |____________
    */
    inclinedRect = [
      new google.maps.Point(1.4193, 1.7269),
      new google.maps.Point(2.2337, -0.1001),
      new google.maps.Point(-1.4193, -1.7269),
      new google.maps.Point(-2.2337, 0.1001),
    ];

    rightRect = [
      new google.maps.Point(1, 1), // sw
      new google.maps.Point(1, 4),
      new google.maps.Point(3, 4), // ne
      new google.maps.Point(3, 1), // se
    ];
  });

  describe("getCenterByVertexPoints", () => {
    test("Calcula en centro del rectangulo inclinado", () => {
      const center = getCenterByVertexPoints(inclinedRect);
      expect(center.x).toBeCloseTo(0, 0.1);
      expect(center.y).toBeCloseTo(0, 0.1);
    });
    test("Confirma que un rectangulo girado dos veces mantiene el mismo centro", () => {
      const center = getCenterByVertexPoints(rightRect);
      const rotatedPoints66 = rotateRectangle(rightRect, 66, center);
      const center2 = getCenterByVertexPoints(rotatedPoints66);
      const enderezadoPoints = rotateRectangle( rotatedPoints66, 24, center);
      const center3 = getCenterByVertexPoints(enderezadoPoints);
      expect(center).toEqual(center2)
      expect(center).toEqual(center3);
    });

  });
  describe("rotateRectangle", () => {

    test("rota un rectángulo recto unos 66 grados", () => {
      const rotatedPoints = rotateRectangle(rightRect, 66);
    });
    test("Endereza el rectangulo, tras dos giros complementarios de 66 + 24 = 90 grados", () => {

      const rotatedPoints66 = rotateRectangle(rightRect, 66);
      const enderezadoPoints = rotateRectangle( rotatedPoints66, 24);

      const { x: firstVertexX, y: firstVertexY } = enderezadoPoints[0];
      // Verify that at least one element of enderezadoPoints has an .x value equal to firstVertexX
      const hasMatchingX = enderezadoPoints.filter((a,index) => index > 0).some(point => point.x === firstVertexX);
      expect(hasMatchingX).toBe(true);

      // Verify that at least one element of enderezadoPoints has a .y value equal to firstVertexY
      const hasMatchingY = enderezadoPoints.filter((a,index) => index > 0).some(point => point.y === firstVertexY);
      expect(hasMatchingY).toBe(true);
    });

  });

  describe("scale Rectangle", () => {
    test("Scale rectangle to 0.5", () => {
      const newPoints = scaleRectangleByPoints(rightRect, 0.5);


      expect(newPoints).toEqual([
        new google.maps.Point(1.5, 1.75),
        new google.maps.Point(1.5, 3.25),
        new google.maps.Point(2.5, 3.25),
        new google.maps.Point(2.5, 1.75),
      ]);
    });
  });

  describe("GET ANGLE: getRectangleInclinationByPoints", () => {
    test("Angle of not inclined, should be 0", () => {
      const deg = getRectangleInclinationByPoints(rightRect);
      expect(deg).toEqual(0);
    });
    test("Angle of inclined rectangle", () => {
      const degrees = 10;
      // const rotatedPoints66 = rightRect;
      const rotatedPoints66 = rotateRectangle(rightRect, degrees);
      let deg = getRectangleInclinationByPoints(rotatedPoints66);
      console.log('deg', deg);

      const rotatedPointsback = rotateRectangle(rightRect, - degrees);
      deg = getRectangleInclinationByPoints(rotatedPointsback);
      console.log('degback', deg);
    });
  });
});
