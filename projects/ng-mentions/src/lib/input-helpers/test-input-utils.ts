//This was pretty much copied with minor changes from ment.io
//  https://github.com/jeff-collins/ment.io/blob/master/src/mentio.service.js#L463
import { assertPresent } from '../utils/utils';

export function getTextAreaOrInputPosition (element: HTMLTextAreaElement | HTMLInputElement, position: number) {
  const properties = [
    'direction',
    'boxSizing',
    'width',
    'height',
    'overflowX',
    'overflowY',
    'borderTopWidth',
    'borderRightWidth',
    'borderBottomWidth',
    'borderLeftWidth',
    'paddingTop',
    'paddingRight',
    'paddingBottom',
    'paddingLeft',
    'fontStyle',
    'fontVariant',
    'fontWeight',
    'fontStretch',
    'fontSize',
    'fontSizeAdjust',
    'lineHeight',
    'fontFamily',
    'textAlign',
    'textTransform',
    'textIndent',
    'textDecoration',
    'letterSpacing',
    'wordSpacing'
  ];

  const isFirefox = ((window as any)['mozInnerScreenX'] !== null);

  //TODO allow control of where element is placed?
  const div = document.createElement('div');
  div.id = 'input-textarea-caret-position-mirror-div';
  document.body.appendChild(div);

  const style = div.style;
  const computed = window.getComputedStyle(element);

  style.whiteSpace = 'pre-wrap';
  if (element.nodeName !== 'INPUT') {
    style.wordWrap = 'break-word';
  }

  // position off-screen
  style.position = 'absolute';
  style.visibility = 'hidden';

  // transfer the element's properties to the div
  properties.forEach(function (prop: any) { //TODO is there a way to make this typesafe?
    style[prop] = computed[prop];
  });

  if (isFirefox) {
    style.width = (Number.parseInt(assertPresent(computed.width), 10) - 2) + 'px';
    if (element.scrollHeight > Number.parseInt(assertPresent(computed.height), 10)) {
      style.overflowY = 'scroll';
    }
  } else {
    style.overflow = 'hidden';
  }

  div.textContent = element.value.substring(0, position);

  if (element.nodeName === 'INPUT') {
    div.textContent = div.textContent.replace(/\s/g, '\u00a0');
  }

  const span = document.createElement('span');
  span.textContent = element.value.substring(position) || '.';
  div.appendChild(span);

  const coordinates = {
    top: span.offsetTop + Number.parseInt(assertPresent(computed.borderTopWidth), 10) - element.scrollTop,
    left: span.offsetLeft + Number.parseInt(assertPresent(computed.borderLeftWidth), 10) - element.scrollLeft,
    fontHeight: Number.parseInt(assertPresent(computed.fontSize), 10),
    offsets: {
      top: span.offsetTop,
      left: span.offsetLeft,
      height: span.offsetHeight,
      width: span.offsetWidth
    }
  };

  document.body.removeChild(div);

  return coordinates;
}
