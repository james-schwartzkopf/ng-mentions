import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { DemoTextareaComponent } from './demo-textarea/demo-textarea.component';
import { NgMentionsModule } from 'ng-mentions';
import { WordsPipe } from './words.pipe';
import { HighlightPipe } from './highlight.pipe';
import { DemoContentEditableComponent } from './demo-content-editable/demo-content-editable.component';

@NgModule({
  declarations: [
    AppComponent,
    DemoTextareaComponent,
    WordsPipe,
    HighlightPipe,
    DemoContentEditableComponent
  ],
  imports: [
    BrowserModule,
    NgMentionsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
