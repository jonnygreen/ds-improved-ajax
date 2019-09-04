import RESTAdapter from 'ember-data/adapters/rest';
import { DEBUG } from '@glimmer/env';
import { run } from '@ember/runloop';
import { Promise } from 'rsvp';
import { warn, assert } from '@ember/debug';
import { parseResponseHeaders } from '@ember-data/adapter/-private';

import {
  TimeoutError,
  AbortError,
} from '@ember-data/adapter/error';

const ImprovedAjaxRestAdapter = RESTAdapter.extend({
  findRecord(store, type, id, snapshot) {
    let request = this._requestFor({
      store, type, id, snapshot,
      requestType: 'findRecord'
    });

    return this._makeRequest(request);
  },

  findAll(store, type, sinceToken, snapshotRecordArray) {
    let query = this.buildQuery(snapshotRecordArray);

    let request = this._requestFor({
      store, type, sinceToken, query,
      snapshots: snapshotRecordArray,
      requestType: 'findAll'
    });

    return this._makeRequest(request);
  },

  query(store, type, query) {
    let request = this._requestFor({
      store, type, query,
      requestType: 'query'
    });

    return this._makeRequest(request);
  },

  queryRecord(store, type, query) {
    let request = this._requestFor({
      store, type, query,
      requestType: 'queryRecord'
    });

    return this._makeRequest(request);
  },

  findMany(store, type, ids, snapshots) {
    let request = this._requestFor({
      store, type, ids, snapshots,
      requestType: 'findMany'
    });

    return this._makeRequest(request);
  },

  findHasMany(store, snapshot, url, relationship) {
    let request = this._requestFor({
      store, snapshot, url, relationship,
      requestType: 'findHasMany'
    });

    return this._makeRequest(request);
  },

  findBelongsTo(store, snapshot, url, relationship) {
    let request = this._requestFor({
      store, snapshot, url, relationship,
      requestType: 'findBelongsTo'
    });

    return this._makeRequest(request);
  },

  createRecord(store, type, snapshot) {
    let request = this._requestFor({
      store, type, snapshot,
      requestType: 'createRecord'
    });

    return this._makeRequest(request);
  },

  updateRecord(store, type, snapshot) {
    let request = this._requestFor({
      store, type, snapshot,
      requestType: 'updateRecord'
    });

    return this._makeRequest(request);
  },

  deleteRecord(store, type, snapshot) {
    let request = this._requestFor({
      store, type, snapshot,
      requestType: 'deleteRecord'
    });

    return this._makeRequest(request);
  },

  /*
     * Get the data (body or query params) for a request.
     *
     * @public
     * @method dataForRequest
     * @param {Object} params
     * @return {Object} data
     */
  dataForRequest(params) {
    let { store, type, snapshot, requestType, query } = params;

    // type is not passed to findBelongsTo and findHasMany
    type = type || (snapshot && snapshot.type);

    let serializer = store.serializerFor(type.modelName);
    let data = {};

    switch (requestType) {
      case 'createRecord':
        serializer.serializeIntoHash(data, type, snapshot, { includeId: true });
        break;

      case 'updateRecord':
        serializer.serializeIntoHash(data, type, snapshot);
        break;

      case 'findRecord':
        data = this.buildQuery(snapshot);
        break;

      case 'findAll':
        if (params.sinceToken) {
          query = query || {};
          query.since = params.sinceToken;
        }
        data = query;
        break;

      case 'query':
      case 'queryRecord':
        if (this.sortQueryParams) {
          query = this.sortQueryParams(query);
        }
        data = query;
        break;

      case 'findMany':
        data = { ids: params.ids };
        break;

      default:
        data = undefined;
        break;
    }

    return data;
  },

  /*
   * Get the HTTP method for a request.
   *
   * @public
   * @method methodForRequest
   * @param {Object} params
   * @return {String} HTTP method
   */
  methodForRequest(params) {
    let { requestType } = params;

    switch (requestType) {
      case 'createRecord': return 'POST';
      case 'updateRecord': return 'PUT';
      case 'deleteRecord': return 'DELETE';
    }

    return 'GET';
  },

  /*
   * Get the URL for a request.
   *
   * @public
   * @method urlForRequest
   * @param {Object} params
   * @return {String} URL
   */
  urlForRequest(params) {
    let { type, id, ids, snapshot, snapshots, requestType, query } = params;

    // type and id are not passed from updateRecord and deleteRecord, hence they
    // are defined if not set
    type = type || (snapshot && snapshot.type);
    id = id || (snapshot && snapshot.id);

    switch (requestType) {
      case 'findAll':
        return this.buildURL(type.modelName, null, snapshots, requestType);

      case 'query':
      case 'queryRecord':
        return this.buildURL(type.modelName, null, null, requestType, query);

      case 'findMany':
        return this.buildURL(type.modelName, ids, snapshots, requestType);

      case 'findHasMany':
      case 'findBelongsTo': {
        let url = this.buildURL(type.modelName, id, snapshot, requestType);
        return this.urlPrefix(params.url, url);
      }
    }

    return this.buildURL(type.modelName, id, snapshot, requestType, query);
  },

  /*
   * Get the headers for a request.
   *
   * By default the value of the `headers` property of the adapter is
   * returned.
   *
   * @public
   * @method headersForRequest
   * @param {Object} params
   * @return {Object} headers
   */
  headersForRequest(params) {
    return this.get('headers');
  },

  /*
   * Get an object which contains all properties for a request which should
   * be made.
   *
   * @private
   * @method _requestFor
   * @param {Object} params
   * @return {Object} request object
   */
  _requestFor(params) {
    let method = this.methodForRequest(params);
    let url = this.urlForRequest(params);
    let headers = this.headersForRequest(params);
    let data = this.dataForRequest(params);

    return { method, url, headers, data };
  },

  /*
   * Convert a request object into a hash which can be passed to `jQuery.ajax`.
   *
   * @private
   * @method _requestToJQueryAjaxHash
   * @param {Object} request
   * @return {Object} jQuery ajax hash
   */
  _requestToJQueryAjaxHash(request) {
    let hash = {};

    hash.type = request.method;
    hash.url = request.url;
    hash.dataType = 'json';
    hash.context = this;

    if (request.data) {
      if (request.method !== 'GET') {
        hash.contentType = 'application/json; charset=utf-8';
        hash.data = JSON.stringify(request.data);
      } else {
        hash.data = request.data;
      }
    }

    let headers = request.headers;
    if (headers !== undefined) {
      hash.beforeSend = function(xhr) {
        Object.keys(headers).forEach((key) => xhr.setRequestHeader(key, headers[key]));
      };
    }

    return hash;
  },

  /*
   * Make a request using `jQuery.ajax`.
   *
   * @private
   * @method _makeRequest
   * @param {Object} request
   * @return {Promise} promise
   */
  _makeRequest(request) {
    let adapter = this;
    let hash = this._requestToJQueryAjaxHash(request);

    let { method, url } = request;
    let requestData = { method, url };

    return new Promise((resolve, reject) => {

      hash.success = function(payload, textStatus, jqXHR) {
        let response = ajaxSuccess(adapter, jqXHR, payload, requestData);
        run.join(null, resolve, response);
      };

      hash.error = function(jqXHR, textStatus, errorThrown) {
        let responseData = {
          textStatus,
          errorThrown
        };
        let error = ajaxError(adapter, jqXHR, requestData, responseData);
        run.join(null, reject, error);
      };

      adapter._ajaxRequest(hash);

    }, `DS: RESTAdapter#makeRequest: ${method} ${url}`);
  }
});

function ajaxSuccess(adapter, jqXHR, payload, requestData) {
  let response;
  try {
    response = adapter.handleResponse(
      jqXHR.status,
      parseResponseHeaders(jqXHR.getAllResponseHeaders()),
      payload,
      requestData
    );
  } catch (error) {
    return Promise.reject(error);
  }

  if (response && response.isAdapterError) {
    return Promise.reject(response);
  } else {
    return response;
  }
}

function ajaxError(adapter, jqXHR, requestData, responseData) {
  if (DEBUG) {
    let message = `The server returned an empty string for ${requestData.method} ${requestData.url}, which cannot be parsed into a valid JSON. Return either null or {}.`;
    let validJSONString = !(responseData.textStatus === "parsererror" && jqXHR.responseText === "");
    warn(message, validJSONString, {
      id: 'ds.adapter.returned-empty-string-as-JSON'
    });
  }

  let error;

  if (responseData.errorThrown instanceof Error) {
    error = responseData.errorThrown;
  } else if (responseData.textStatus === 'timeout') {
    error = new TimeoutError();
  } else if (responseData.textStatus === 'abort' || jqXHR.status === 0) {
    error = new AbortError();
  } else {
    try {
      error = adapter.handleResponse(
        jqXHR.status,
        parseResponseHeaders(jqXHR.getAllResponseHeaders()),
        adapter.parseErrorResponse(jqXHR.responseText) || responseData.errorThrown,
        requestData
      );
    } catch (e) {
      error = e;
    }
  }

  return error;
}

if (DEBUG) {
  ImprovedAjaxRestAdapter.reopen({
    init() {
      this._super();

      assert(
`You implemented a custom ajax method on a RESTAdapter using ds-improved-ajax.
 You should import the ember-data version of this adapter instead.
 
 - import RESTAdapter from 'ds-improved-ajax/adapters/rest';
 + import RESTAdapter from 'ember-data/adapters/rest';
 `,
        this.ajax === ImprovedAjaxRestAdapter.prototype.ajax
      );
      assert(
`You implemented a custom ajaxOptions method on a RESTAdapter using ds-improved-ajax.
 You should import the ember-data version of this adapter instead.
 
 - import RESTAdapter from 'ds-improved-ajax/adapters/rest';
 + import RESTAdapter from 'ember-data/adapters/rest';
 `,
        this.ajaxOptions === ImprovedAjaxRestAdapter.prototype.ajaxOptions
      );
    },
  });
}

export default ImprovedAjaxRestAdapter;
