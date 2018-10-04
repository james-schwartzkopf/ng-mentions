import { ElementRef, Inject, Injectable } from '@angular/core';
import { MentionInputHelper } from './mentions.model';
import { TextInputMentionInputHelper } from './input-helpers/text-input-mention-input-helper';
import { DOCUMENT } from '@angular/common';
import { ContentEditableMentionInputHelper } from './input-helpers/content-editable-mention-input-helper';

@Injectable({
  providedIn: 'root'
})
export class MentionHelperLocatorService {

  private readonly document: Document;
  constructor(@Inject(DOCUMENT) document: any) {
    //https://github.com/angular/angular/issues/20351
    this.document = document;
  }

  createHelper(el: ElementRef<HTMLElement>): MentionInputHelper {
    if (el.nativeElement.tagName === 'INPUT' || el.nativeElement.tagName === 'TEXTAREA') {
      return new TextInputMentionInputHelper(el.nativeElement as (HTMLInputElement | HTMLTextAreaElement), this.document);
    }

    if (el.nativeElement.isContentEditable) {
      return new ContentEditableMentionInputHelper(el.nativeElement, this.document);
    }

    throw new Error(`Element ${el.nativeElement.tagName} is currently not supported by MentionHelperLocatorService`);
  }
}
