import { fromEvent, merge, Observable } from 'rxjs';
import { Mention, MentionInputHelper, MentionWatchEvent } from '../mentions.model';
import { filter, map } from 'rxjs/operators';
import { assertPresent, currentValue } from '../utils/utils';
import { findMentionCandidateFromSelection, findTextNodeAt, getContentEditableCoordinatesAt } from './content-editable-utils';

export class ContentEditableMentionInputHelper implements MentionInputHelper {
  watchEvents$: Observable<MentionWatchEvent | null>;
  outsideClickStream$: Observable<Event>;
  keydownEvents$: Observable<KeyboardEvent>;

  constructor(private input: HTMLElement, private document: Document) {
    this.watchEvents$ = merge(
      //TODO Need alternative for IE11 (MutationObserver, but replace or other code edits may interfere)??
      //  could use keyup, etc. but hard to cover all cases including menus and drag/drop, etc.
      fromEvent(input, 'input'),
      fromEvent(input, 'focus'),
      fromEvent(document, 'selectionchange').pipe(filter(() => this.document.activeElement === input)),
      //TODO can't tell blur from dropdown click from regular blur
      //fromEvent(input, 'blur'),
    ).pipe(
      map(() => {
        const sel = this.document.getSelection();
        //TODO is there a more efficient way to do this?
        //no search while text is actually selected
        if (!sel || !sel.anchorNode || sel.toString().length !== 0) {
          return null;
        }

        if (!input.contains(document.activeElement) || !input.contains(sel.anchorNode)) {
          return null;
        }

        return findMentionCandidateFromSelection(sel);
      }),
    );

    this.outsideClickStream$ = merge(
      fromEvent<MouseEvent>(this.document, 'click'),
      fromEvent<TouchEvent>(this.document, 'touchend')
    ).pipe(
      filter(event => !input.contains(event.target as Node))
    );

    this.keydownEvents$ = fromEvent<KeyboardEvent>(input, 'keydown');
  }

  replace(mention: Mention, replacement: string): void {
    this.input.focus(); //focus my have been lost to popup click

    const start = findTextNodeAt(mention.context, mention.start);
    const end = findTextNodeAt(mention.context, mention.start + mention.mention.length);
    if (!start || !end) {
      console.error(`Failed to find replacement position`, {mention, replacement});
      throw new Error(`Failed to find replacement position`);
    }


    const sel = document.defaultView.getSelection();
    const range = document.createRange();
    const replacementNode = document.createTextNode(replacement);

    range.setStart(start.node, start.offset);
    range.setEnd(end.node, end.offset);
    range.deleteContents();
    range.insertNode(replacementNode);

    range.setStartAfter(replacementNode);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);

    //let angular and other listeners know whe changed things
    const evt = document.createEvent('HTMLEvents');
    evt.initEvent('input', false, true);
    this.input.dispatchEvent(evt);
  }

  getBoundingRectProvider(mention$: Observable<Mention>) {
    return {
      getBoundingClientRect: (): ClientRect  => {
        //TODO seems like this will fragment the text nodes till they are 1 per char :<(, probably need a better method.
        //  wonder if it would be better to normalize after of if that would just make it worse?  For that matter maybe
        //  cache, but need to be careful of scrolling then.

        const mention = currentValue(mention$);
        const start = findTextNodeAt(mention.context, mention.start);

        //coordinates are already relative to viewport
        const mentionCoords = getContentEditableCoordinatesAt(this.document, assertPresent(start));
        const ret = {
          top: mentionCoords.top,
          left: mentionCoords.left,
          height: mentionCoords.height,
          //width doesn't matter since we only position above and below
          width: mentionCoords.height
        };

        return {
          ...ret,
          right: ret.left + ret.width,
          bottom: ret.top + ret.height
        };
      }
    };
  }

  public isSameMentionPosition(m1: Mention | null, m2: Mention | null) {
    return !!(
      m1 === m2
      ||
        m1 && m2
        && m1.start === m2.start
        && m1.context.parent === m2.context.parent
        && m1.context.from === m2.context.from
    );
  }

}
