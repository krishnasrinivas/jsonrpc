# Minimal JSON RPC 2.0 Javascript Library [![Gitter](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/minio/minio?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

## Install

```bash
$ git clone https://github.com/minio/jsonrpc
$ npm install
```

## Example

```js
#!/usr/bin/env node

var JSONRpc = require('jsonrpc')

var jrpc = new JSONRpc({
  endpoint: 'http://localhost:9001/rpc',
  namespace: 'Auth'
})

jrpc.call('Get', {}, function(error, data) {
  if (error) {
    console.log(error)
    return
  }
  console.log(data)
})
```

