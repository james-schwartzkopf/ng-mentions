import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MentionList } from 'ng-mentions';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'proofs-example-two',
  templateUrl: './example-two.component.html',
  styleUrls: ['./example-two.component.css']
})
export class ExampleTwoComponent implements AfterViewInit {
  @ViewChild(MentionList) peopleList: MentionList;
  public matches$: Observable<{name: string; handle: string}[]>;
  ngAfterViewInit() {
    this.matches$ = this.peopleList.mentionTerm$.pipe(
      map(t => this.people.filter(p => p.handle.indexOf(t) > -1))
    );
  }

  private people = [
    { handle: 'john.lennon', name: 'John Lennon'},
    { handle: 'paul.mccartney', name: 'Paul McCartney'},
    { handle: 'george.harrison', name: 'George Harrison'},
    { handle: 'ringo.starr', name: 'Ringo Starr'},
  ];
}
