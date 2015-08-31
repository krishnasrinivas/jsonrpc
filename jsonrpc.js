/*
 * Minimal JSON RPC 2.0 Library for Javascript, (C) 2015 Minio, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

function error(msg) {
  console.log(backtrace());
  throw new Error(msg);
}

function backtrace() {
  try {
    throw new Error();
  } catch (e) {
    return e.stack ? e.stack.split('\n').slice(2).join('\n') : '';
  }
}

// Validates if URL is safe and allowed, e.g. to avoid XSS.
function isValidUrl(url, allowRelative) {
  if (!url) {
    return false;
  }
  // RFC 3986 (http://tools.ietf.org/html/rfc3986#section-3.1)
  // scheme = ALPHA *( ALPHA / DIGIT / "+" / "-" / "." )
  var protocol = /^[a-z][a-z0-9+\-.]*(?=:)/i.exec(url);
  if (!protocol) {
    return allowRelative;
  }
  protocol = protocol[0].toLowerCase();
  switch (protocol) {
  case 'http':
  case 'https':
    return true;
  default:
    return false;
  }
}

var jsonrpc = {
  version: '2.0',
  endpoint: null,
  namespace: null,
  request: function(params) {
    if (!params) {
      error('Invalid params');
    }
    // allowing relative url for now
    if (!isValidUrl(params.endpoint, true)) {
      error('Invalid url');
    }
    this.endpoint = params.endpoint;
    this.namespace = params.namespace;
    return this;
  },
  call: function(method, options, cb) {
    if (!options) {
      options = { id: 1};
    }
    if (!options.id) {
      options.id = 1;
    }
    var dataObj = {
      jsonrpc: this.version,
      method: this.namespace ? this.namespace +'.'+ method : method,
      params: options.params ? options.params : [],
      id: options.id
    }
    var jsonData = JSON.stringify(dataObj);
    this._doRequest(jsonData, cb)
  },

  _doRequest: function(data, cb) {
    var xmlhttp = new XMLHttpRequest(),
        method = 'POST',
        url = this.endpoint;

    xmlhttp.open(method, url, true);
    xmlhttp.setRequestHeader('Content-Type', 'application/json');    
    xmlhttp.onreadystatechange = function() {
      if (4 !== xmlhttp.readyState) {
        return;
      }
      if (200 !== xmlhttp.status) {
        if (400 === xmlhttp.status) {
          cb(JSON.parse(xmlhttp.responseText), null);
          return;
        }
        if (404 === xmlhttp.status) {
          cb({error: 'Endpoint url not found', version: '2.0'}, null);
          return;
        }
        cb({error: 'Unknown internal server error', version: '2.0'}, null);
        return;
      }
      cb(null, JSON.parse(xmlhttp.responseText));
    }
    xmlhttp.send(data);
  },
}

