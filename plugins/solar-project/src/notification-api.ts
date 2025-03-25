import { getCurrentStepCocoMap } from ".";


const PRESET_MSG: Record<string, string> = {
  STEP1_SELECT_ROOF: 'Please select a roof in the map where you want to install your solar panels.',
  STEP1_ROOF_SELECTED: 'Good. You have selected the roof. Now, click on the next button.',
  STEP2_DRAGGABLE_BOUNDING_BOX: 'We have detected %s segments in your roof. There might be a small displacement with the satellite image, please adjust it by dragging the segments',
  STEP2_RETURNING: 'Check that the red squares are the most aligned possible to the shape of the roof',
  STEP3_EDIT_OR_SELECT: 'You have setup the sola panel for %s of the roofs. You can keep on editing or submit the fotm by clicking NEXT',
  STEP3_SELECT_SEGMENT: 'There are %s segments on this building. Please start by selecting one of them to create your solar panel installation',
  STEP3_SEGMENT_SELECTED: 'Good. You have selected one of the segments of %s square meters. Now click again on the segment to start designing the rectangle of your solar panel installation',
  STEP3_SEGMENT_SELECTED_WITH_RECTANGLE: 'You can remove the individual solar panels by clicking on the button Edit Solar Panels and selecting the panels that you want to remove',
  STEP3_CLICK_ON_SOLAR_PANEL: 'When you finish editing the solar panels, you can click on Save to apply the changes.',
  STEP3_START_EDIT_PANELS: 'Pass the button over the solar panels. You can remove some of them by clicking it over',
  STEP3_HOVERING_SEGMENT: 'This is the roof segment %s with an area of %s square meters and a tilt of %s degrees.',
  STEP3_HOVERING_SEGMENT_WITH_RECTANGLE: 'Click to edit or delete the solar panel rectangle.',
  STEP3_FIRST_VERTEX_RECTANGLE: 'You have just selected the first vertex of the rectangle where your panels will be placed. <br> Now choose the size of the rectangle and click the mouse when ready. You can always resize the rectangle later.',
  STEP3_SECOND_VERTEX_RECTANGLE: 'The rectangle has been updated. Now you can click on Save to apply the changes.',
};

/**
 * Usage:
 * test it with
 * debug.createNotification('STEP1_ROOF_SELECTED');
 *
 * @param message
 * @returns
 */
export const createNotification = (message: string, placeholders: string[] = []) => {
  //cleanup
  window.cocoNotifications = window.cocoNotifications ?? {};
  if (window.cocoNotifications?.container) {
    window.cocoNotifications.container.remove();
  }

  // get the current map
  const cocoMapSetup = getCurrentStepCocoMap();
  if ( !cocoMapSetup ) {
    return;
  }

  let messageText = message;

  const parentConteiner = cocoMapSetup.map.getDiv();

  const notificationDiv = document.createElement('div');
  notificationDiv.classList.add('coco-solar-notification');
  notificationDiv.textContent = message;
  (parentConteiner?.parentNode ?? document.body).insertBefore(notificationDiv, parentConteiner);
  window.cocoNotifications.container = notificationDiv;

  // retrieve the message:
  if (PRESET_MSG[messageText]) {
    notificationDiv.dataset.messageId = messageText;
    messageText = PRESET_MSG[messageText];
  }

  // replacements. Replace the %s with the array of placeholders
  if (placeholders.length) {
    placeholders.forEach((placeholder, index) => {
      messageText = messageText.replace(`%s`, placeholder);
    });
  }


  notificationDiv.innerHTML = messageText;
};


export const removeNotification = (messageKey?: string | null) => {
  if (window.cocoNotifications?.container) {
    if (!messageKey || window.cocoNotifications.container.dataset.messageId === messageKey) {
      console.log('Removing notification', messageKey);
      window.cocoNotifications.container.remove();
      window.cocoNotifications.container = null;
      window.cocoNotifications = {};
    }
  }
  // TODO: remove only if the message key is given.
}