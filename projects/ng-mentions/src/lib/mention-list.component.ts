import {
  AfterContentInit, ChangeDetectorRef,
  Component,
  ContentChildren,
  ElementRef, EventEmitter, forwardRef, Inject, InjectionToken,
  Input,
  NgZone, OnDestroy,
  OnInit, Optional, Output,
  QueryList, TemplateRef, ViewChild,
  ViewContainerRef
} from '@angular/core';
import { concat, merge, Observable, Subject } from 'rxjs';
import {
  delay,
  distinctUntilChanged,
  filter,
  last,
  map,
  switchMap,
  take,
  takeUntil,
  tap,
  withLatestFrom
} from 'rxjs/operators';
import { MENTION_ITEM_LISTENER, MentionItem } from './mention-item.directive';
import { ActiveDescendantKeyManager } from '@angular/cdk/a11y';
import {
  ConnectedPosition,
  FlexibleConnectedPositionStrategy,
  Overlay,
  OverlayConfig, OverlayRef,
  PositionStrategy,
  ScrollStrategy,
} from '@angular/cdk/overlay';
import { Directionality } from '@angular/cdk/bidi';
import { DOCUMENT } from '@angular/common';
import { TemplatePortal } from '@angular/cdk/portal';
import { ENTER, ESCAPE } from '@angular/cdk/keycodes';
import { BoundingClientRectProvider, Mention, MentionHandler, MentionParser, MentionReplacer } from './mentions.model';
import { isPresent } from './utils/utils';
import { getScrollParent } from './utils/html-utils';

export const MENTIONS_SCROLL_STRATEGY =
  new InjectionToken<() => ScrollStrategy>('mentions-scroll-strategy');
export function MENTIONS_SCROLL_STRATEGY_FACTORY(overlay: Overlay): () => ScrollStrategy {
  return () => overlay.scrollStrategies.reposition();
}

export interface ScrollStrategyFactory {
  //tslint:disable-next-line:callable-types
  (): ScrollStrategy;
}

/** @docs-private */
export const MENTIONS_SCROLL_STRATEGY_FACTORY_PROVIDER = {
  provide: MENTIONS_SCROLL_STRATEGY,
  deps: [Overlay],
  useFactory: MENTIONS_SCROLL_STRATEGY_FACTORY,
};

export function charMentionReplacer(char: string): MentionReplacer {
  return (mention: Mention, value: string) => char + value;
}

//kept getting non-breaking spaces in content editable?
//  so using this instead of s.indexOf(' ', position)
function indexOfSpace(s: string, position: number) {
  const re = /\s/g;
  re.lastIndex = position;
  const m = re.exec(s);
  return m ? m.index : -1;
}

export function charMentionFinder(char: string): MentionParser {
  return (source: string, caret: number, context: any) => {
    const start = source.lastIndexOf(char, caret);
    if (start > -1) {
      const end = indexOfSpace(source, start);
      if (end > -1 && end < caret ) {
        return null;
      }
      const mention = source.substring(start, end > 0 ? end : undefined);
      return {
        start,
        source,
        mention,
        term: mention.substr(char.length),
        context
      };
    }
    return null;
  };
}

@Component({
  selector: 'mention-list',
  template: `
    <ng-template>
      <div class="mention-list-panel {{classList}}" [style.display.none]="!panelVisible">
        <ng-content></ng-content>
      </div>
    </ng-template>
  `,
  providers: [{provide: MENTION_ITEM_LISTENER, useExisting: forwardRef(() => MentionList)}]
})
export class MentionList implements AfterContentInit, OnDestroy, MentionHandler {
  //tslint:disable-next-line:no-input-rename
  @Input('class') classList = '';

  @Input() public mentionParser: MentionParser = charMentionFinder('@');
  @Input() public mentionReplacer: MentionReplacer = charMentionReplacer('@');
  @Input() public set mentionChar(char: string) {
    this.mentionParser = charMentionFinder(char);
    this.mentionReplacer = charMentionReplacer(char);
  }
  @ContentChildren(MentionItem, { descendants: true }) items: QueryList<MentionItem>;

  @ViewChild(TemplateRef) template: TemplateRef<any>;

  public mention$: Observable<Mention>;
  public mentionTerm$: Observable<string>;

  @Output() mentionSelected: EventEmitter<MentionItem> = new EventEmitter();

  private mentionSubject: Subject<Observable<Mention>> = new Subject();
  private keyManager: ActiveDescendantKeyManager<MentionItem>;

  public panelVisible = false;

  private ngOnDestroy$ = new Subject<void>();
  ngOnDestroy() {
    this.ngOnDestroy$.next();
    this.ngOnDestroy$.complete();
  }

  private readonly document: Document;
  constructor(
    private element: ElementRef<HTMLInputElement>,
    private overlay: Overlay,
    private viewContainerRef: ViewContainerRef,
    private zone: NgZone,
    private changeDetectorRef: ChangeDetectorRef,
    @Inject(MENTIONS_SCROLL_STRATEGY) private scrollStrategy: ScrollStrategyFactory,
    @Optional() @Inject(Directionality) private dir: Directionality | null,
    @Inject(DOCUMENT) document: any,
  ) {
    //https://github.com/angular/angular/issues/20351
    this.document = document;
    this.mention$ = this.mentionSubject.pipe(switchMap(s => s));
    this.mentionTerm$ = this.mention$.pipe(map(m => m && m.term));
  }

  ngAfterContentInit() {
    this.keyManager = new ActiveDescendantKeyManager<MentionItem>(this.items).withWrap();
  }

  open(
    mention$: Observable<Mention>,
    outsideClickStream$: Observable<Event>,
    mentionRect: BoundingClientRectProvider,
    keyboardEvents$: Observable<KeyboardEvent>
  ): Observable<string> {
    this.mentionSubject.next(mention$);

    const portal = new TemplatePortal(this.template, this.viewContainerRef);

    const positionStrategy = this.getOverlayPosition(mentionRect);
    const overlayRef = this.overlay.create(this.getOverlayConfig(positionStrategy));
    overlayRef.attach(portal);

    const closingActions = new Subject<void>();
    const end$ = merge(
      outsideClickStream$.pipe(
        filter(e => !overlayRef.overlayElement.contains(e.target as Node)),
      ),
      mention$.pipe(last()),
      overlayRef.detachments(),
      this.keyManager.tabOut,
      this.mentionSelected.asObservable(),
      closingActions,
    ).pipe(take(1));
    end$.subscribe(undefined, undefined, () => overlayRef.dispose());

    this.watchOptions(overlayRef, positionStrategy, end$);

    this.keyManager.change.pipe(
      takeUntil(end$),
      map(() => this.keyManager.activeItem),
      distinctUntilChanged(),
      filter(isPresent)
    ).subscribe(i => this.scrollIntoView(i, overlayRef));

    keyboardEvents$.pipe(takeUntil(end$)).subscribe(e => {
      if (e.keyCode === ENTER && this.keyManager.activeItem) {
        e.preventDefault();
        this.mentionSelected.emit(this.keyManager.activeItem);
        return;
      } else if (e.keyCode === ESCAPE) {
        e.preventDefault();
        closingActions.next();
        return;
      }

      this.keyManager.onKeydown(e);
    });

    return this.mentionSelected.asObservable().pipe(
      take(1),
      withLatestFrom(mention$),
      map(([selectedMention, sourceMention]) => this.mentionReplacer(sourceMention, selectedMention.value))
    );
  }

  private scrollIntoView(item: MentionItem, overlay: OverlayRef) {
    const el = item.el.nativeElement;
    const scrollParent = getScrollParent(el);
    if (!overlay.overlayElement.contains(scrollParent)) {
      return;
    }

    const elRect = el.getBoundingClientRect();
    const spRect = scrollParent.getBoundingClientRect();
    if (elRect.top < spRect.top) {
      scrollParent.scrollTop -= spRect.top - elRect.top;
    } else if (elRect.bottom > spRect.bottom) {
      scrollParent.scrollTop += elRect.bottom - spRect.bottom;
    }
  }


  private watchOptions(overlayRef: OverlayRef, positionStrategy: FlexibleConnectedPositionStrategy, until$: Observable<any>): void {
    const firstStable = this.zone.onStable.asObservable().pipe(
      take(1),
      map(() => this.items)
    );
    const optionChanges = concat(firstStable, this.items.changes).pipe(
      tap(() => positionStrategy.reapplyLastPosition()),
      // Defer emitting to the stream until the next tick, because changing
      // bindings in here will cause "changed after checked" errors.
      delay(0),
      tap(items => {
        if (items.length > 0 && !this.panelVisible) {
          this.panelVisible = true;
          this.changeDetectorRef.detectChanges();
        }

        if (items.length === 0 && this.panelVisible) {
          this.panelVisible = false;
          this.changeDetectorRef.detectChanges();
        }

        if (items.length > 0) {
          this.keyManager.setFirstItemActive();
          this.changeDetectorRef.detectChanges();
          overlayRef.updatePosition();
        }
      }),
      takeUntil(until$)
    ).subscribe();
  }


  private getOverlayConfig(
    positionStrategy: PositionStrategy
  ): OverlayConfig {
    return new OverlayConfig({
      positionStrategy: positionStrategy,
      scrollStrategy: this.scrollStrategy(),
      direction: this.dir || undefined,
    });
  }

  private getOverlayPosition(mentionRect: {getBoundingClientRect(): ClientRect | DOMRect}) {
    return this.overlay.position()
      .flexibleConnectedTo(mentionRect as HTMLElement)
      .withFlexibleDimensions(true)
      .withPush(false)
      .withPositions([
        {
          originX: 'start',
          originY: 'bottom',
          overlayX: 'start',
          overlayY: 'top',
          panelClass: 'mention-panel-below'
        } as ConnectedPosition,
        {
          originX: 'start',
          originY: 'top',
          overlayX: 'start',
          overlayY: 'bottom',

          // The overlay edge connected to the trigger should have squared corners, while
          // the opposite end has rounded corners. We apply a CSS class to swap the
          // border-radius based on the overlay position.
          //TODO how did panel class work?
          //  NOTE: this is what I get for looking a master, pretty sure this is a 7.0 thing
          panelClass: 'mention-panel-above'
        }  as ConnectedPosition
      ]);
  }

  selectItem(item: MentionItem) {
    this.mentionSelected.emit(item);
  }
}
