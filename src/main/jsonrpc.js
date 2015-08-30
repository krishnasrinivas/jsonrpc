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

require('source-map-support').install()

var Http = require('http'),
    Https = require('https'),
    Url = require('url'),
    Concat = require('concat-stream'),
    Stream = require('stream')

var parseSuccess = (response, cb) => {
  if (typeof response !== 'undefined') {
    response.pipe(Concat(successBody => {
      if (successBody.length === 0) {
        throw new Error('No response was received')
      }
      return cb(null, JSON.Parse(successBody.toString()))
    }))
  } else {
    throw new Error('No response was received')
  }
}

var parseError = (response, cb) => {
  if (typeof response !== 'undefined') {
    response.pipe(Concat(errorBody => {
      if (errorBody.length === 0) {
        throw new Error('No response was received')
      }
      return cb(JSON.Parse(errorBody.toString()))
    }))
  } else {
    throw new Error('No response was received')
  }
}

class Client {
  constructor(params, transport) {
    if (params === undefined) {
      throw new Error('No params specified')
    }
    if (params.namespace === undefined) {
      throw new Error('namespace must be a string')
    }
    if (params.path === undefined) {
      throw new Error('path must be a string')
    }
    var parsedEndpoint = Url.parse(params.endpoint),
        port = +parsedEndpoint.port

    if (transport) {
      this.transport = transport
    } else {
      switch (parsedEndpoint.protocol) {
      case 'http:': {
        this.transport = Http
        this.scheme = 'http'
        if (port === 0) {
          port = 80
        }
        break
      }
      case 'https:': {
        this.transport = Https
        this.scheme = 'https'
        if (port === 0) {
          port = 443
        }
        break
      }
      default: {
        throw new Error('Unknown protocol: ' + parsedEndpoint.protocol)
      }
      }
    }
    this.version = '2.0'
    this.path = params.path
    this.namespace = params.namespace
    this.params = {
      host: parsedEndpoint.hostname,
      port: port
    }
  }

  makeRequest(method, options, cb) {
    if (!options) {
      options = {id: 1}
    }
    if (!options.id) {
      options.id = 1
    }

    var dataStream = new Stream.Readable(),
        dataObj = {
          version: this.version,
          method: this.namespace ? this.namespace +'.'+ method : method,
          id: options.id,
          params: options.params
        },
        requestParams = {
          host: this.params.host,
          port: this.params.port,
          path: this.path,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        }

    dataStream._read = function() {}
    dataStream.push(JSON.stringify(dataObj))
    dataStream.push(null)

    var request = this.transport.request(requestParams, (response) => {
      if (response.statusCode !== 200) {
        return parseError(response, cb)
      }
      parseSuccess(response, cb)
    })
    dataStream.pipe(request)
  }
}

module.exports = Client
