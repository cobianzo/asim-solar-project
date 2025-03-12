import setupSegments from "./setup-segments-interactive-functions";
import { ExtendedSegment } from "./types";


export const debugSetup = () => {

  const ratioParent = document.getElementsByClassName('segment-rotation');
  const inputOptions = ratioParent[0]?.querySelectorAll('input');

  inputOptions?.forEach((radio) => {
    radio.addEventListener('change', (event) => {
        // Obtener el valor del radio button seleccionado
        const valorSeleccionado = (event.target as HTMLInputElement).value;
        console.log(`Opción seleccionada: ${valorSeleccionado}`);
        setupSegments( valorSeleccionado as 'no-rotation-at-all' | 'no-extra-rotation' | 'rotate-90-only-portrait' | 'rotate-all' );
    });
});
}

export const createPopup = function (elementContentToClone: Element) {
  const oldPopup = document.getElementById('popup-info');
  if (oldPopup) {
    oldPopup.remove();
  }

  const popup = document.createElement('div');
  popup.id = `popup-info`;
  popup.classList.add('popup');
  // Add content to the popup
  popup.innerHTML = elementContentToClone.innerHTML;
  document.body.appendChild(popup);

  popup.addEventListener('click', (event) => {
    popup.remove();
  });

}

export const highlightSegmentInfo = function(roofSegment: ExtendedSegment) {
  const index = roofSegment.indexInMap;
  const id = '#segment-basic-info-' + index;
  const divInfo = document.querySelectorAll(`.grid-h ${id}`);
  if (divInfo.length) Array.from(divInfo).forEach(el => {
    el.classList.add('highlight');
    console.log('%c Highlighting segment info', 'background: #222; color: #bada55', id, el.classList, divInfo);
  });
}
export const resetSegmentsInfo = function() {
  const divInfo = document.querySelectorAll(`.grid-h .segment-basic-info`);
  if (divInfo.length) Array.from(divInfo).forEach(el => {
    el.classList.remove('highlight');
  });
}

export const clonarYReemplazarElemento = function(selector: string, claseNueva: string) {
  // Seleccionar el elemento original
  const elementoOriginal = document.querySelector(selector);

  if (!elementoOriginal) {
      console.error(`No se encontró ningún elemento con el selector: ${selector}`);
      return;
  }

  // Clonar el elemento
  const elementoClonado = elementoOriginal.cloneNode(true);

  // Aplicar la nueva clase al elemento clonado
  elementoClonado.classList.add(claseNueva);

  // Reemplazar el elemento original con el clonado
  elementoOriginal.replaceWith(elementoClonado);

  console.log(`Elemento clonado y reemplazado con éxito. Nueva clase: ${claseNueva}`);
}