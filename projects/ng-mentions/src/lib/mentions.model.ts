import { Observable } from 'rxjs';

export interface Mention {
  //original candidate text that was searched
  source: string;
  //starting index of mention in source
  start: number;
  //matching mention text, includes anchor characters (@, #, etc)
  mention: string;
  //mention text minus anchor characters
  term: string;

  //Context from MentionWatchEvent
  context: any;
}

/**
 * Event emitted by MentionInputHelper whenever the MentionWatcher should check
 * for new/changed mentions.
 */
export interface MentionWatchEvent {
  value: string; //current input value that should be searched for mentions
  caret: number; //caret position in value
  /**
   * If present, context will be copied into an parsed Mention
   * It can then be used to help implement isSameMentionPosition if needed.
   */
  context: any;
}

//Parse candidate text from MentionWatchEvent for a potential Mention
export type MentionParser = (
  //candidate text to search
  source: string,
  //position of the input caret, Mention should contain the caret
  caret: number,
  //should be copied to any Mention returned
  context: any
) => (Mention | null);
//Translate value from MentionItem to replacement text.  This can be used to add back anchor characters (@, #, etc), etc.
//  will be the same mention created by the parser, so extra properties can be used to store context.
export type MentionReplacer = (mention: Mention, value: string) => string;

//Rather than the whole element interface, just the getBoundingClientRect() method used by CDK position strategy
export interface BoundingClientRectProvider {
  getBoundingClientRect(): ClientRect;
}

//Abstraction used by MentionWatcher to open popup.
//  Implemented by MentionList.
export interface MentionHandler {
  mentionParser: MentionParser;

  open(
    mention$: Observable<Mention>,
    outsideClickStream$: Observable<Event>,
    mentionRect: BoundingClientRectProvider,
    keyboardEvents$: Observable<KeyboardEvent>
  ): Observable<string>;
}

//Abstraction allowing MentionWatcher to work with different input types.
//  Currently implementations for textarea/input[type=text] and contentEditable.
export interface MentionInputHelper {
  //Should emit whenever an event happens that could trigger a mention popup
  //  Defaults for textarea are selectionchange, input, focus, and blur
  //  null acts to force a watch to end (e.g. on blur).
  //  null also allows a focus to be recognized as a change
  watchEvents$: Observable<MentionWatchEvent | null>;

  //click/touch events outside of the input (used to close dropdown)
  outsideClickStream$: Observable<Event>;

  //keydown events used to control popup selections
  keydownEvents$: Observable<KeyboardEvent>;

  //Replace the existing mention with the replacement text.  Should also handle
  // restoring focus adn caret position (if lost to dropdown click), and notifying event listeners (NgForm, etc).
  replace(mention: Mention, replacement: string): void;

  //provides the rectangle around the mention used position the popup, should be relative to the viewport
  getBoundingRectProvider(mention$: Observable<Mention>): BoundingClientRectProvider;

  //Should return true if both mentions represent the same position in the input (i.e. we should keep the same dropdown)
  isSameMentionPosition(m1: Mention | null, m2: Mention | null): boolean;
}
