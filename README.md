**THIS ADDON SHOULD NOT BE USED**

This addon is old and dead. It should not be added to any new Ember apps and has been removed from the Ember Desktop in https://github.com/phorest/phorest-desktop-ember/pull/1692. Please use standard Ember Data patterns instead of this as ds-improved-ajax was an experiment that has since been abandoned.

This repo should be considered for deletion.

<hr/>


ds-improved-ajax
==============================================================================

This RFC restores the behavior of the `ds-improved-ajax` feature flag for `ember-data`.

`ember-data` has decided to pursue another direction instead of this proposal,
and this addon is a temporary offering that will be deprecated once  `ember-data`
releases an alternative.

This feature allowed users to customize how a request is formed by overwriting
-  `methodForRequest`, `urlForRequest`, `headersForRequest` and `bodyForRequest`
-  in adapters extending from `DS.RESTAdapter` and `DS.JSONAPIAdapter`.

Installation
------------------------------------------------------------------------------

```
ember install ds-improved-ajax
```


Usage
------------------------------------------------------------------------------

Make sure your adapters that depend on this functionality extend from this addon's adapters.  This addon does not change the behavior of `ember-data`'s adapters.

eg change

```js
// <APP>/adapters/application.js
import DS from 'ember-data';

export default DS.RESTAdapter.extend({
  // ...
});
```

to

```js
// <APP>/adapters/application.js
import RESTAdapter from 'ds-improved-ajax/adapters/rest';

export default RESTAdapter.extend({
  // ...
});
```

or change

```js
// <APP>/adapters/application.js
import DS from 'ember-data';

export default DS.JSONAPIAdapter.extend({
  // ...
});
```

to

```js
// <APP>/adapters/application.js
import JSONAPIAdapter from 'ds-improved-ajax/adapters/json-api';

export default JSONAPIAdapter.extend({
  // ...
});
```

If you do not have an application adapter you can re-export the `json-api` adapter.

```js
// <APP>/adapters/application.js
import JSONAPIAdapter from 'ds-improved-ajax/adapters/json-api';

export default JSONAPIAdapter;
```

Contributing
------------------------------------------------------------------------------

### Installation

* `git clone <repository-url>`
* `cd ds-improved-ajax`
* `npm install`

### Linting

* `npm run lint:js`
* `npm run lint:js -- --fix`

### Running tests

* `ember test` – Runs the test suite on the current Ember version
* `ember test --server` – Runs the test suite in "watch mode"
* `npm test` – Runs `ember try:each` to test your addon against multiple Ember versions

### Running the dummy application

* `ember serve`
* Visit the dummy application at [http://localhost:4200](http://localhost:4200).

For more information on using ember-cli, visit [https://ember-cli.com/](https://ember-cli.com/).

License
------------------------------------------------------------------------------

This project is licensed under the [MIT License](LICENSE.md).
