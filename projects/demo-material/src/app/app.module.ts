import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { WordsPipe } from './words.pipe';
import { DemoTextareaComponent } from './demo-textarea/demo-textarea.component';
import { DemoContentEditableComponent } from './demo-content-editable/demo-content-editable.component';
import { NgMentionsModule } from 'ng-mentions';
import { MatIconModule, MatListModule, MatRippleModule } from '@angular/material';

@NgModule({
  declarations: [
    AppComponent,
    DemoTextareaComponent,
    WordsPipe,
    DemoContentEditableComponent
  ],
  imports: [
    BrowserModule,
    MatRippleModule,
    MatListModule,
    MatIconModule,
    NgMentionsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
