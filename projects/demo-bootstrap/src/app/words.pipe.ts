import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'words'
})
export class WordsPipe implements PipeTransform {

  transform(value: string, words?: number): any {
    if (!words || !value) {
      return value;
    }
    if (words < 1) {
      return '';
    }

    const splitValue = value.split(' ');
    if (splitValue.length > words) {
      return value.split(' ').slice(0, words).join(' ') + '\u2026';
    }

    return value;
  }

}
