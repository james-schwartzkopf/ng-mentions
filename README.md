# Ng Mentions

Simple Angular mentions inspired by [Ment.io](https://github.com/jeff-collins/ment.io)
  & [Angular Mentions](http://dmacfarlane.github.io/angular-mentions/).


Provides auto-complete suggestions for @mentions in text input fields, text areas,
and content editable fields (content editable support is currently limited). 

This is still a work in progress.  Expect breaking changes, although I will try to minimize
them for the common use cases.

To install and start the demo application:

    git clone https://github.com/james-schwartzkopf/ng-mentions.git
    cd ng-mentions
    yarn
    ng build ng-mentions
    ng serve demo-material --port 4200
    ng serve demo-bootstrap --port 4201

### Usage

Add the package as a dependency to your project using:

    yarn add ng-mentions

Add the @angular/cdk:

    yarn add @angular/cdk

Import the CDK overlay CSS in your src/styles.css or src/styles.scss file:
```css
@import "~@angular/cdk/overlay-prebuilt.css";
```
    
<aside class="notice">
ng-mentions does not mandate any CSS framework.  Although it's part of the @angular/material
project, the CDK provides funtionality without styling.  You can use @angular/material, bootstrap, or
your own CSS to style the mention list popups.
</aside>


Add the module to your app.module imports:

```typescript
import { NgMentionsModule } from 'ng-mentions';
...

@NgModule({
    imports: [ NgMentionsModule ],
    ...
})
```

Add the `[mentionWatcher]` directive to your input element:

```html
<textarea type="text" [mentionWatcher]="peopleList"></textarea>
```

Where `peopleList` is a <mention-list> component. For example:

```html
<mention-list #peopleList>
  <ul class="people-list">
    <li [mentionItem]="'john.lennon'">John Lennon</li>
    <li [mentionItem]="'paul.mccartney'">Paul McCartney</li>
    <li [mentionItem]="'george.harrison'">George Harrison</li>
    <li [mentionItem]="'ringo.starr'">Ringo Starr</li>
  </ul>
</mention-list>
```

Add some CSS to style the dropdown panel:
```css
ul.people-list {
  background-color: white;
  border: black solid 1px;
  list-style: none;
  margin: 0;
  padding: 0;
}

ul.people-list li {
  margin: 0;
  padding: 4px
}

ul.people-list li:hover  {
  background-color: lightgrey;
}

ul.people-list li.active  {
  background-color: lightskyblue;
}
```

Type the '@' character and the dropdown list should appear.

You can use the MentionList.mentionTerm$ observable to filter your list:
```typescript
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
```

```html
<mention-list #peopleList>
  <ul class="people-list">
    <li *ngFor="let person of matches$ | async"
      [mentionItem]="person.handle"
    >
      {{person.name}}
    </li>
  </ul>
</mention-list>
```

You can change the character used for mentions:
```html
<mention-list #songList mentionChar="#">
  <ul class="song-list">
    <li [mentionItem]="'come-together'">Come Together</li>
    <li [mentionItem]="'let-it-be'">Let It Be</li>
    <li [mentionItem]="'yesterday'">Yesterday</li>
    <li [mentionItem]="'strawberry-fields'">Strawberry Fields Forever</li>
  </ul>
</mention-list>
```

You can have multiple <mention-list> on a single watcher:
```html
<textarea type="text" [mentionWatcher]="[peopleList, songList]"></textarea>
```

The <mention-list> mentionParser and mentionReplacer attributes can be used
to customize how mentions are parsed.

```typescript
  //TODO example of custom parser/replacer
```

### More Examples

See the demo-material & demo-bootstrap examples in the workspace repo for examples
of how to create mention list using the respective frameworks.

### Custom Content Editable Support

The included support for content editable is currently very limited.  It does not
support replacing with anything but text, searching across HTML tags, etc.  It also
does not support IFRAMEs (TinyMCE).

It does however have an interface that allows for creating customized input
support.  See the MentionInputHelper interface.  The ContentEditableMentionInputHelper and
TextInputMentionInputHelper classes can be used as examples of how to implement the interface.

Adding support for TinyMCE should mostly be a matter of tweaking ContentEditableMentionInputHelper
so that getBoundingRectProvider accounts for the IFRAME, and changing the source event streams
for watchEvents$.

### TODO

This is still a work in progress.

1 Improve & finalize MentionInputHelper interface.
2) Unit & e2e tests
3) Improve @angular/material support
4) Better documentation
5) Finalize Component/Directive input/outputs
6) Better parsers
7) Improve contentEditable support
8) Support for TinyMCE
9) Suggestions welcome
