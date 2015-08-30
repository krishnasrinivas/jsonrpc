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
    Stream = require('stream'),
    ValidUrl = require('valid-url'),
    parseSuccess = (response, cb) => {
      if (typeof response !== 'undefined') {
        response.setEncoding('utf8')
        var body = ''
        response.on('data', function(chunk) {
          body += chunk
        })
        response.on('end', function() {
          return cb(null, JSON.parse(body.toString()))
        })
      } else {
        throw new Error('No response was received')
      }
    },
    parseError = (response, cb) => {
      if (typeof response !== 'undefined') {
        response.setEncoding('utf8')
        var body = ''
        response.on('data', function(chunk) {
          body += chunk
        })
        response.on('end', function() {
          if (body.length !== 0) {
            return cb(JSON.parse(body.toString()))
          }
        })
      } else {
        throw new Error('No response was received')
      }
    }

class Client {
  constructor(params, transport) {
    if (params === undefined) {
      throw new Error('No params specified')
    }
    if (!ValidUrl.isWebUri(params.endpoint)) {
      throw new Error('Invalid URL')
    }
    var parsedEndpoint = Url.parse(params.endpoint),
        port = parsedEndpoint.port,
        host = parsedEndpoint.hostname,
        path = parsedEndpoint.pathname

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
    this.namespace = params.namespace
    this.params = {
      host: host,
      port: port,
      path: path
    }
  }

  call(method, options, cb) {
    if (!options) {
      options = {id: 1}
    }
    if (!options.id) {
      options.id = 1
    }

    var dataStream = new Stream.Readable(),
        dataObj = {
          version: this.version,
          id: options.id,
          params: options.params ? options.params : []
        },
        requestParams = {
          host: this.params.host,
          port: this.params.port,
          path: this.params.path,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        }

    // prefix namespace as provided
    if (this.namespace) {
      dataObj.method = this.namespace +
        '.' + method
    } else {
      dataObj.method = method
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
