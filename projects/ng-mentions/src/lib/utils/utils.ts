import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';

export function currentValue<T>(o: Observable<T>): T {
  let ret: T, taken = false;

  o.pipe(take(1)).subscribe((t) => {
    ret = t;
    taken = true;
  });
  if (!taken) {
    throw new Error('Subscription was not immediate');
  }

  //Despite what TS & TSLINT think, we do know ret has been initialized here
  //  The non-null assertion is an oddball way of disabling the typescript used
  //  before assign error, and then we need to disable tslint's warning that
  //  we used the non-null assert.
  return ret!; //tslint:disable-line:no-non-null-assertion
}

export function isPresent<T>(t: T|null|undefined): t is T {
  return t !== null && t !== undefined;
}

export function assertPresent<T>(t: T|null|undefined): T {
  if (!isPresent(t)) {
    throw new Error('Expected value to be defined');
  }
  return t;
}
