import { ChangeDetectorRef, Directive, ElementRef, HostBinding, HostListener, Inject, InjectionToken, Input } from '@angular/core';
import { Highlightable } from '@angular/cdk/a11y';

export interface OnSelectItem {
  selectItem(item: MentionItem): void;
}

export const MENTION_ITEM_LISTENER = new InjectionToken<OnSelectItem>('MENTION_ITEM_LISTENER');
@Directive({
  selector: '[mentionItem]'
})
export class MentionItem implements Highlightable {
  //tslint:disable-next-line:no-input-rename
  @Input('mentionItem') value: string;

  @Input() activeClass = 'active';

  public active = false;

  @HostListener('click', ['$event'])
  select($event: Event) {
    $event.preventDefault();
    this.list.selectItem(this);
  }

  constructor(
    public el: ElementRef<HTMLElement>,
    @Inject(MENTION_ITEM_LISTENER) private list: OnSelectItem,
    private cd: ChangeDetectorRef
  ) { }

  setActiveStyles() {
    this.active = true;
    this.el.nativeElement.classList.add(this.activeClass);
    this.cd.detectChanges();
  }

  setInactiveStyles() {
    this.active = false;
    this.el.nativeElement.classList.remove(this.activeClass);
    this.cd.detectChanges();
  }
}
