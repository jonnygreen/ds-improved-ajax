import RESTAdapter from './rest';
import { DEBUG } from '@glimmer/env';
import { assert } from '@ember/debug';
import { dasherize } from '@ember/string';
import { pluralize } from 'ember-inflector';

const JSONAPIAdapter = RESTAdapter.extend({
  defaultSerializer: '-json-api',

  pathForType(modelName) {
    let dasherized = dasherize(modelName);
    return pluralize(dasherized);
  },

  methodForRequest(params) {
    if (params.requestType === 'updateRecord') {
      return 'PATCH';
    }

    return this._super(...arguments);
  },

  dataForRequest(params) {
    let { requestType, ids } = params;

    if (requestType === 'findMany') {
      return {
        filter: { id: ids.join(',') }
      };
    }

    if (requestType === 'updateRecord') {
      let { store, type, snapshot } = params;
      let data = {};
      let serializer = store.serializerFor(type.modelName);

      serializer.serializeIntoHash(data, type, snapshot, { includeId: true });

      return data;
    }

    return this._super(...arguments);
  },

  headersForRequest() {
    let headers = this._super(...arguments) || {};

    headers['Accept'] = 'application/vnd.api+json';

    return headers;
  },

  _requestToJQueryAjaxHash() {
    let hash = this._super(...arguments);

    if (hash.contentType) {
      hash.contentType = 'application/vnd.api+json';
    }

    return hash;
  }
});

if (DEBUG) {
  JSONAPIAdapter.reopen({
    init() {
      this._super();

      assert(
        `You implemented a custom ajax method on a JSONAPIAdapter using ds-improved-ajax.
 You should import the ember-data version of this adapter instead.
 
 - import JSONAPIAdapter from 'ds-improved-ajax/adapters/json-api';
 + import JSONAPIAdapter from 'ember-data/adapters/json-api';
 `,
        this.ajax === JSONAPIAdapter.prototype.ajax
      );
      assert(
        `You implemented a custom ajaxOptions method on a JSONAPIAdapter using ds-improved-ajax.
 You should import the ember-data version of this adapter instead.
 
 - import JSONAPIAdapter from 'ds-improved-ajax/adapters/json-api';
 + import JSONAPIAdapter from 'ember-data/adapters/json-api';
 `,
        this.ajaxOptions === JSONAPIAdapter.prototype.ajaxOptions
      );
    },
  });
}

export default JSONAPIAdapter;
