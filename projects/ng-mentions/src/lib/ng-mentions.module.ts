import { NgModule } from '@angular/core';
import { MentionWatcher } from './mention-watcher.directive';
import { MentionList, MENTIONS_SCROLL_STRATEGY_FACTORY_PROVIDER } from './mention-list.component';
import { MentionItem } from './mention-item.directive';
import { OverlayModule } from '@angular/cdk/overlay';

@NgModule({
  imports: [
    OverlayModule
  ],
  declarations: [MentionWatcher, MentionList, MentionItem],
  exports: [MentionWatcher, MentionList, MentionItem],
  providers: [MENTIONS_SCROLL_STRATEGY_FACTORY_PROVIDER]
})
export class NgMentionsModule { }
