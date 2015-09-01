/*
 * Minimal JSON RPC 2.0 Client Library for Javascript, (C) 2015 Minio, Inc.
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

(function(global) {
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

  function JsonRPCRequest(params) {
    var settings = {
      version: '2.0'
    }
    if (!params) {
      error('Invalid params');
    }
    // allow relative url
    if (!isValidUrl(params.endpoint, true)) {
      error('Invalid url');
    }

    // Overwrite and define settings with options if they exist.
    for (var key in settings) {
      this[key] = settings[key];
    }

    for (var key in params) {
      this[key] = params[key];
    }

    var self = this;

    function _doRequest(data, cb) {
      var xmlhttp = new XMLHttpRequest(),
          method = 'POST',
          url = self.endpoint;

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
    }

    this.call = function (method, options, cb) {
      if (!options) {
        options = { id: 1};
      }
      if (!options.id) {
        options.id = 1;
      }
      var dataObj = {
        jsonrpc: self.version,
        method: self.namespace ? self.namespace +'.'+ method : method,
        params: options.params ? options.params : [],
        id: options.id
      }
      var jsonData = JSON.stringify(dataObj);
      _doRequest(jsonData, cb)
    }
  }
  global.JsonRPCRequest = JsonRPCRequest;
})(this);
