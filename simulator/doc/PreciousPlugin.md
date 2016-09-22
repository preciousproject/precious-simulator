# Precious Plugin
The Precious Plugin gives you the basic functionality of every Plugin, like managing Requests.
```javascript
const PreciousPlugin = require('./path/to/file/');
var pp = new PreciousPlugin('my-plugin');

//Register for plugin notifications
pp.on('my-type', (request) => {
    ... //handle request
});

pp.on('my-status', {status: true}, (data) => {
    ... //handle status update
});
```
## Methods
### PreciousPlugin([pluginName])
Initializes a PreciousPlugin object for specified Plugin. If `pluginName` is omitted, no API calls can be received. Attempting to do so will result in an `ReferenceError` in `on` Method


### on(type [, options], callback)
Registers a type of requests for current Plugin, or a status message.  

* `ID` String, name of the plugin
* `options` Object
    * `interval` if set, handler will be called in specified Intervals, passing the result to the app, default is 0, which means no timer is started.
    * `status` bool, sets if identifier is a status update
    * `maxContinuousHandlers` number, if set, so many continuous handlers are simultaneously allowed
* `callback` Method to handle request. See below.

##### Errors

* `ReferenceError` is thrown if no `pluginName` was specified but an API event should be received.
    
#### Handler
Handles specific Request.

##### Handler for API requests:
If an exception is thrown inside the callback function, an error Message is returned to the app with the given error message. 
If no error message is defined, `unknown error` is sent instead.

* Arguments
    * `request arguments` received arguments
    * `raw response` empty response object: 
        * `responseType = success`
        * requestID is set
        * userInfo is set
* Returns
    * Response Object
  
##### Handler for status requests:

* Arguments
    * `request arguments`received arguments
* Returns
    * status update, if `undefined`, no update is sent

### sendStatus(state)
Sends state to Precious App.

* Arguments
    * `state` state to send
* Returns
    * `undefined`

### pipe([arg1][, arg2][, ...])
Calls handlers for all Continuous Get requests immediately. Does not reset Timer value.
Given arguments are passed to the handler, additionally first argument is the request itself and last argument is a empty response object as described above.

### onUpdate(callback)

* Arguments
    * `callback` Function which is called upon updating any request of that plugin. There is no possibility to interfere with the update process.
        * Arugments
            * `oldRequest` unchanged request
            * `newParams` new parameters, which will override old ones
        * Returns
            * `undefined`



