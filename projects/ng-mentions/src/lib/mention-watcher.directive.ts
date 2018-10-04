import { Directive, ElementRef, Input, OnDestroy } from '@angular/core';
import { merge, Observable, Subject } from 'rxjs';
import { distinctUntilChanged, filter, map, share, shareReplay, switchMap, takeUntil, tap, withLatestFrom, } from 'rxjs/operators';
import { MentionHelperLocatorService } from './mention-helper-locator.service';
import { Mention, MentionHandler, MentionInputHelper } from './mentions.model';
import { isPresent } from './utils/utils';


@Directive({
  selector: '[mentionWatcher]',
  exportAs: 'mentionWatcher'
})
export class MentionWatcher implements OnDestroy {
  //tslint:disable-next-line:no-input-rename
  @Input('mentionWatcher')
  set handlers(handlers: MentionHandler[] | MentionHandler) {
    this.handlerArray = Array.isArray(handlers) ? [...handlers] : [handlers];
  }

  private handlerArray: MentionHandler[] = [];

  activeMention$: Observable<Mention | null | undefined>;
  inputHelper: MentionInputHelper;

  private onDestroy$ = new Subject<void>();
  ngOnDestroy() {
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }

  constructor(private el: ElementRef<HTMLElement>, inputHelperLocator: MentionHelperLocatorService) {
    this.inputHelper = inputHelperLocator.createHelper(el);

    //Open when:
    //
    //caret mention changes
    //  caret changes after close

    //TODO was thinking about using caret to reopen dropdown when they select and go back (LEFT_ARROW) into mention,
    //  but that would also reopen in the case where they used ESCAPE to close, which would probably be annoying,
    //  but maybe we should at least reopen if text changes?
    //[handle, mention, caret]
    const hmc$ = this.inputHelper.watchEvents$.pipe(
      map((i): [MentionHandler, Mention, number] | [null, null, null] => {
        if (!i) { return [null, null, null]; }

        let idx = Number.MAX_VALUE;
        let mention: Mention | null = null;
        let handler: MentionHandler | null = null;
        this.handlerArray.forEach(h => {
          const m = h.mentionParser(i.value, i.caret, i.context);
          if (m && m.start < idx) {
            idx = m.start;
            mention = m;
            handler = h;
          }
        });

        return [handler, mention, mention && i.caret];
      }),
      share()
    );

    this.activeMention$ = hmc$.pipe(
      map(([h, m]) => m),
      distinctUntilChanged(),
      takeUntil(this.onDestroy$),
      shareReplay(1)
    );

    this.activeMention$.subscribe(); //sub so replay is primed

    //TODO changing value after selecting (maybe ESCAPE too?) should reopen
    const watchedMentionChange$ = hmc$.pipe(
      distinctUntilChanged(
        ([h1, m1], [h2, m2]) => (
          h1 === h2 && this.inputHelper.isSameMentionPosition(m1, m2)
        )
      ),
      map(([h]) => h),
      share()
    );

    //Note the handler will have it's own closing events
    const closeDialogEvents$ = merge(
      watchedMentionChange$
    );

    const replacements$ = watchedMentionChange$.pipe(
      filter(isPresent),
      switchMap((h): Observable<[string, Mention]> => {
        const m$ = this.activeMention$.pipe(
          takeUntil(closeDialogEvents$),
          //filter isn't actually needed since closeDialogEvents$ will fire first
          filter(isPresent),
          shareReplay(1)
        );
        const r$ = h.open(
          m$,
          this.inputHelper.outsideClickStream$,
          this.inputHelper.getBoundingRectProvider(m$),
          this.inputHelper.keydownEvents$
        );
        return r$.pipe(withLatestFrom(m$));
      })
    );

    replacements$.subscribe(([r, m]) => this.inputHelper.replace(m, r));
  }

}
