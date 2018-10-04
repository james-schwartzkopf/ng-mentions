import { fromEvent, merge, Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { Mention} from '../mentions.model';
import { MentionInputHelper, MentionWatchEvent } from '../mentions.model';
import { getTextAreaOrInputPosition } from './test-input-utils';
import { currentValue } from '../utils/utils';

export class TextInputMentionInputHelper implements MentionInputHelper {
  watchEvents$: Observable<MentionWatchEvent | null>;
  outsideClickStream$: Observable<Event>;
  keydownEvents$: Observable<KeyboardEvent>;

  constructor(private input: HTMLTextAreaElement | HTMLInputElement, private document: Document) {
    this.watchEvents$ = merge(
      fromEvent(input, 'input'),
      fromEvent(input, 'focus'),
      fromEvent(document, 'selectionchange').pipe(filter(() => this.document.activeElement === input)),
      //TODO can't tell blur from dropdown click from regular blur
      //fromEvent(input, 'blur'),
    ).pipe(
      map(() => (
        //no search while text is actually selected
        input.selectionStart === input.selectionEnd
          ? {value: input.value, caret: input.selectionStart || 0, context: undefined}
          : null
      )),
      map(e => this.document.activeElement === input ? e : null)
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

    const v = this.input.value;
    this.input.value = v.substr(0, mention.start) + replacement + v.substr(mention.start + mention.mention.length);

    const caretPos = mention.start + replacement.length;
    this.input.setSelectionRange(caretPos, caretPos);

    //let angular and other listeners know whe changed things
    const evt = document.createEvent('HTMLEvents');
    evt.initEvent('input', false, true);
    this.input.dispatchEvent(evt);
  }

  getBoundingRectProvider(mention$: Observable<Mention>) {
    return {
      getBoundingClientRect: (): ClientRect  => {
        const rect = this.input.getBoundingClientRect();
        const mentionCoords = getTextAreaOrInputPosition(this.input, currentValue(mention$).start);
        const ret = {
          top: rect.top + mentionCoords.top,
          left: rect.left + mentionCoords.left,
          height: mentionCoords.fontHeight,
          //width doesn't matter since we only position above and below
          width: mentionCoords.fontHeight
        };

        return {
          ...ret,
          right: ret.left + ret.width,
          bottom: ret.top + ret.height
        };
      }
    };
  }

  public isSameMentionPosition(m1: Mention | null, m2: Mention | null): boolean {
    return !!(
      m1 === m2
      ||
      m1 && m2
      && m1.start === m2.start
    );
  }

}
