import { getCurrentStepCocoMap } from ".";


const PRESET_MSG: Record<string, string> = {
  STEP1_SELECT_ROOF: 'Please select a roof in the map where you want to install your solar panels.',
  STEP1_ROOF_SELECTED: 'Good. You have selected the roof. Now, click on the next button.',
  STEP2_DRAGGABLE_BOUNDING_BOX: 'We have detected %s segments in your roof. There might be a small displacement with the satellite image, please adjust it by dragging the segments',
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
  (parentConteiner?? document.body).appendChild(notificationDiv);
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


  notificationDiv.textContent = messageText;
};


export const removeNotification = (messageKey: string | null) => {
  if (window.cocoNotifications?.container) {
    if (!messageKey || window.cocoNotifications.container.dataset.messageId === messageKey) {
      console.log('Removing notification', messageKey);
      window.cocoNotifications.container.remove();
      window.cocoNotifications.container = null;
      window.cocoNotifications = {};
    }
  }
}