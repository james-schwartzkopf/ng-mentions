import { Component, OnInit, ViewChild } from '@angular/core';
import { Observable } from 'rxjs';
import { people, People, Product, products } from '../model';
import { map } from 'rxjs/operators';
import { MentionList } from 'ng-mentions';

@Component({
  selector: 'app-mat-demo-textarea',
  templateUrl: './demo-textarea.component.html',
  styleUrls: ['./demo-textarea.component.css']
})
export class DemoTextareaComponent implements OnInit {
  @ViewChild('peopleList', {read: MentionList}) peopleList: MentionList;
  @ViewChild('productList', {read: MentionList}) productList: MentionList;

  matchingPeople$: Observable<People[]>;
  matchingProducts$: Observable<Product[]>;

  constructor() {  }

  ngOnInit() {
    //Ideally you would score the results so matches at the start of the string/word would sort higher
    this.matchingPeople$ = this.peopleList.mentionTerm$.pipe(
      map(term => term.toUpperCase()),
      map(term => people.filter(p => !term || p.name.toUpperCase().indexOf(term) > -1))
    );
    this.matchingProducts$ = this.productList.mentionTerm$.pipe(
      map(term => term.toUpperCase()),
      //TODO switch this example to a switchMap + service call
      map(term => products.filter(p => !term || p.title.toUpperCase().indexOf(term) > -1))
    );
  }
}
