import { MentionWatchEvent } from '../mentions.model';
import { isElement, isTextNode } from '../utils/html-utils';

export interface TextNodePositionContext {
  parent: HTMLElement;
  from: Node | null;
}


export function findMentionCandidateFromSelection(sel: Selection): MentionWatchEvent | null {
  if (!sel || !sel.anchorNode) {
    return null;
  }

  return findMentionCandidate(sel.anchorNode, sel.anchorOffset);
}

function findMentionCandidate(node: Node, caret: number): MentionWatchEvent | null {
  if (isElement(node)) { //TODO really unsure about the element case, need testing/research
    const context = {parent: node, from: null };
    const text = findTextNodeAt(context, 0);
    return {
      value: text ? text.node.wholeText : '',
      caret: 0,
      context
    };
  }

  //TODO Not sure what else it can be, comment? Not sure why caret would be there
  if (!isTextNode(node)) {
    return null;
  }

  const parent = node.parentNode as HTMLElement;
  let from: Node | null = node.previousSibling;
  while (from && isTextNode(from)) {
    caret = caret + from.data.length;
    from = from.previousSibling;
  }

  if (from === null || isElement(from)) {
    //why do I need to type from, I thought the guard would narrow it?
    const context = {parent, from: from as HTMLElement};
    const text = findTextNodeAt(context, 0);
    return { value: text ? text.node.wholeText : '', caret, context };
  } else {
    return null;
  }
}

export function findTextNodeAt(context: TextNodePositionContext, offset: number): {node: Text, offset: number} | null {
  const start = context.from || context.parent.firstChild;
  let text = isTextNode(start) ? start : nextText(start);
  while (text) {
    if (text.data.length >= offset) {
      return {node: text, offset};
    }
    offset = offset - text.data.length;
    text = nextText(text);
  }
  return null;
}

function nextText(node: Node | null): Text | null {
  if (node && node.nextSibling && isTextNode(node.nextSibling)) {
    return node.nextSibling;
  }
  return null;
}

export function getContentEditableCoordinatesAt(document: Document, pos: {node: Text, offset: number}) {
  const markerTextChar = '\ufeff'; //ZERO WIDTH NO-BREAK SPACE

  const sel = document.defaultView.getSelection();
  const prevRange = sel.getRangeAt(0);
  const range = document.createRange();

  range.setStart(pos.node, pos.offset);
  range.setEnd(pos.node, pos.offset);

  range.collapse(false);

  // Create the marker element containing a single invisible character using DOM methods and insert it
  const markerEl = document.createElement('span');
  markerEl.className = 'mention-pos-marker';
  markerEl.appendChild(document.createTextNode(markerTextChar));
  range.insertNode(markerEl);

  const rect = markerEl.getBoundingClientRect();

  const coordinates = {
    left: rect.left,
    top: rect.top,
    height: rect.height
  };

  //tslint:disable-next-line:no-non-null-assertion - we just inserted it, we know it has a parent
  markerEl.parentNode!.removeChild(markerEl);

  sel.removeAllRanges();
  sel.addRange(prevRange);
  return coordinates;
}

