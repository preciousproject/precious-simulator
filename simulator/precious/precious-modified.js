(function() {
  //////////////////////////////////////// Start simulator overhead
  /////// additional changes in lines 469 - 555
  window.$ = window.jQuery = require('jquery');
  window._ = require('underscore');
  window.preciousAppId = 0;
  const ipc = require('electron').ipcRenderer;
  var send = (api,data) => {
    "use strict";
    ipc.send('simulator-api', {api:api, data: data});
  };
  ipc.on('simulator-response', (event, args) => {
    "use strict";
    var requestID;
    requestID = args.requestID;
    return window.Precious.respondRequest(requestID, args);
  });

  //////////////////////////////////////// end simulator overhead
  var Module, Precious, gps, iced, jsrequests, log, moduleKeywords, requests, restrequests, __iced_k, __iced_k_noop,
    __slice = [].slice,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  iced = {
    Deferrals: (function() {
      function _Class(_arg) {
        this.continuation = _arg;
        this.count = 1;
        this.ret = null;
      }

      _Class.prototype._fulfill = function() {
        if (!--this.count) {
          return this.continuation(this.ret);
        }
      };

      _Class.prototype.defer = function(defer_params) {
        ++this.count;
        return (function(_this) {
          return function() {
            var inner_params, _ref;
            inner_params = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
            if (defer_params != null) {
              if ((_ref = defer_params.assign_fn) != null) {
                _ref.apply(null, inner_params);
              }
            }
            return _this._fulfill();
          };
        })(this);
      };

      return _Class;

    })(),
    findDeferral: function() {
      return null;
    },
    trampoline: function(_fn) {
      return _fn();
    }
  };
  __iced_k = __iced_k_noop = function() {};

  moduleKeywords = ['extended', 'included'];

  Module = (function() {
    function Module() {}

    Module.extend = function(obj) {
      var key, value, _ref;
      for (key in obj) {
        value = obj[key];
        if (__indexOf.call(moduleKeywords, key) < 0) {
          this[key] = value;
        }
      }
      if ((_ref = obj.extended) != null) {
        _ref.apply(this);
      }
      return this;
    };

    Module.include = function(obj) {
      var key, value, _ref;
      for (key in obj) {
        value = obj[key];
        if (__indexOf.call(moduleKeywords, key) < 0) {
          this.prototype[key] = value;
        }
      }
      if ((_ref = obj.included) != null) {
        _ref.apply(this);
      }
      return this;
    };

    Module.extendPlugin = function(obj) {
      var key, value;
      if (this.plugins == null) {
        this.plugins = {};
      }
      for (key in obj) {
        value = obj[key];
        if (__indexOf.call(moduleKeywords, key) < 0) {
          this.plugins[key] = value;
        }
      }
      return this;
    };

    return Module;

  })();

  requests = {
    initRequests: function() {
      this._requests = {};
      this._requestCount = 0;
      this._validRequestWays = ['REST', 'JS'];
      return this._validRequestTypes = {
        InternalError: -1,
        SingleGet: 0,
        ContinousGet: 1,
        SinglePost: 2,
        UpdateRequest: 3,
        RemoveRequest: 4
      };
    },
    getRequestLength: function() {
      return Math.max(0, this._requestQueue.length - 1);
    },
    generateRequestId: function() {
      this._requestCount += 1;
      return 'request_' + this._requestCount;
    },
    checkRequestWay: function(type) {
      var i, t, _i, _len, _ref;
      _ref = this._validRequestWays;
      for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
        t = _ref[i];
        if (t === type) {
          return i;
        }
      }
      return -1;
    },
    checkRequestType: function(type) {
      var i, t, _ref;
      _ref = this._validRequestTypes;
      for (t in _ref) {
        if (!__hasProp.call(_ref, t)) continue;
        i = _ref[t];
        if (type === i) {
          return true;
        }
      }
      return false;
    },
    composeRequest: function(requestType, requestWay, requestID, plugin, query, userInfo) {
      var request;
      request = {
        "requestType": requestType,
        "requestID": requestID,
        "pluginID": plugin,
        "appId": this.APPID,
        "appUUID": this.APPUUID
      };
      this._.extend(request, query);
      if (userInfo != null) {
        request.userInfo = userInfo;
      }
      return request;
    },
    requestExists: function(requestId) {
      if (this._requests == null) {
        return false;
      }
      if (this._requests[requestId] == null) {
        return false;
      }
      return true;
    },
    getErrorObject: function(errorCode, message) {
      return {
        errorCode: errorCode,
        msg: message
      };
    },

    /*
    	@description removes request from listener and sends remove message to sandbox
    	@param {string} requestId request wich is removed
    	@param {Function} callback (error, respond) -> void
    	@returns this
     */
    removeRequest: function(requestId, callback) {
      if (!this.requestExists(requestId)) {
        callback.call(this, this.getErrorObject(1, "Request not found."), null);
        return this;
      }
      this.makeRequest(this._validRequestTypes.RemoveRequest, 'JS', this._requests[requestId].plugin, {
        id: requestId
      }, callback);
      return this;
    },

    /*
    	@description updates a given request
    	@param {string} requestId request which is changed
    	@param {object} params new params which are passed to the plugin
    	@param {Function} callback (error, respond) -> void
    	@returns this
     */
    updateRequest: function(requestId, params, callback) {
      if (!this.requestExists(requestId)) {
        callback.call(this, this.getErrorObject(1, "Request not found."), null);
        return this;
      }
      this.makeRequest(this._validRequestTypes.UpdateRequest, 'JS', this._requests[requestId].plugin, {
        id: requestId,
        params: params
      }, callback);
      return this;
    },

    /*
    	@description does additional validation of update requests
    	@param {object} error represents error message
    	@param {object} response 
    	@param {Function} callback original callback
    	@param {object} callbackContext original context
     */
    validateUpdateRespond: function(error, response, request, requestId) {
      if (request.requestType === this._validRequestTypes.RemoveRequest && (error == null)) {
        delete this._requests[request.updatedRequest];
      }
      request.callback.call(request.context, error, response);
      return this;
    },

    /*
    	@description generates request id and adds request to listener array
    	@param {Function} callback
    	@param {string} pluginId
    	@returns {string} requestId
     */
    pushRequest: function(callback, pluginId, requestType, query) {
      var requestId, requestObject;
      if (this._requests == null) {
        this.initRequests();
      }
      while (true) {
        requestId = this.generateRequestId();
        if (this._requests[requestId] == null) {
          break;
        }
      }
      if (!this.checkRequestType(requestType)) {
        return;
      }
      requestObject = {
        callback: callback,
        context: this,
        plugin: pluginId,
        requestType: requestType
      };
      if (requestType === this._validRequestTypes.UpdateRequest || requestType === this._validRequestTypes.RemoveRequest) {
        requestObject.updatedRequest = query.id;
      }
      this._requests[requestId] = requestObject;
      return requestId;
    },
    markRequestAsInternalError: function(requestId) {
      if ((this._requests == null) || (this._requests[requestId] == null)) {
        return;
      }
      this._requests[requestId].requestType = this._validRequestTypes.InternalError;
      return this;
    },

    /*
    	@description Generate and sends a Request
    	@param {requestType|int} requestType type of request (single,continous,...)
    	@param {string} requestWay defines on which way (REST,JS,...) the sandbox is contacted
    	@param {string} plugin id of the requested plugin (gps,...)
    	@param {object} query queryspecific parameters
    	@param {Function} callback which is executed on respond (error, respond) -> void
    	@param {object} userInfo optional object which includes user info, is passed through to response
     */
    makeRequest: function(requestType, requestWay, plugin, query, callback, userInfo) {
      var actualType, requestId, requestQuery;
      requestId = this.pushRequest(callback, plugin, requestType, query);
      actualType = this.checkRequestWay(requestWay);
      if (actualType === -1) {
        this.markRequestAsInternalError(requestId);
        this.respondRequest(requestId, {
          status: 1,
          msg: "Unsupported Request Way called"
        });
        return;
      }
      if (this.checkRequestType(requestType) === false) {
        this.markRequestAsInternalError(requestId);
        this.respondRequest(requestId, {
          status: 1,
          msg: "Unsupported Request Type"
        });
        return;
      }
      requestQuery = this.composeRequest(requestType, requestWay, requestId, plugin, query, userInfo);
      switch (actualType) {
        case 0:
          if (requestType === this._validRequestTypes.ContinousGet) {
            callback.call(this, this.getErrorObject(1, "ContinousGet not supported with REST"), null);
            return;
          }
          this.makeHTTPRequest(requestId, requestQuery);
          break;
        case 1:
          this.makeJSRequest(requestId, requestQuery);
          break;
        default:
          return;
      }
      return requestId;
    },
    reportError: function(message) {
      console.log("Error chaptured: " + message);
      return this.logError(message);
    },
    getRequest: function(requestId) {
      var request;
      if (this._requests == null) {
        return null;
      }
      request = this._requests[requestId];
      if (this.getRequestLength === 0 || !request) {
        this.reportError("no corresponding request found.");
        return null;
      }
      if (!request.callback || !request.context) {
        this.reportError("no callback or context.");
        return null;
      }
      if (typeof request.callback !== 'function') {
        this.reportError("callback isn't a function.");
        return null;
      }
      if (typeof request.context !== 'object') {
        this.reportError("context isn't an object.");
        return null;
      }
      if (request.requestType !== this._validRequestTypes.ContinousGet) {
        delete this._requests[requestId];
      }
      return request;
    },
    respondRequest: function(requestID, response) {
      var error, errorObject, request, responseObject, _ref;
      request = this.getRequest(requestID);
      if (request == null) {
        if (response.error != null) {
          this.reportError(response.error);
        }
        return;
      }
      if (response.status == null) {
        response.status = 1;
        response.error = "Invalid statuscode";
      }
      error = response.status;
      if (error !== 0) {
        if (error === 2 && (this._requests[requestID] != null)) {
          delete this._requests[requestID];
        }
        errorObject = this.getErrorObject(error, response.error);
        if (response.userInfo != null) {
          errorObject.userInfo = response.userInfo;
        }
        responseObject = null;
      } else {
        errorObject = null;
        responseObject = response;
      }
      if ((_ref = request.requestType) === this._validRequestTypes.UpdateRequest || _ref === this._validRequestTypes.RemoveRequest) {
        this.validateUpdateRespond(errorObject, responseObject, request, requestID);
      } else {
        request.callback.call(request.context, errorObject, responseObject);
      }
      return this;
    },
    getStatusMessage: function(data) {
      if ((data.request != null)) {
        switch (data.request) {
          case "close":
            if ((this.onclose != null) && typeof this.onclose === 'function') {
              if (this.onclose()) {
                this.close();
              }
            } else {
              this.close();
            }
            break;
          case "minimize":
            if ((this.onminimize != null) && typeof this.onminimize === 'function') {
              this.onminimize();
            }
            break;
          case "maximize":
            this.addParams(data.params);
            if ((this.onmaximize != null) && typeof this.onmaximize === 'function') {
              this.onmaximize(data.params != null);
            }
            break;
          case "appDidEnterBackground":
            if ((this.onappDidEnterBackground != null) && typeof this.onappDidEnterBackground === 'function') {
              this.onappDidEnterBackground();
            } else {
              this.endBackgroundTask();
            }
            break;
          case "appDidBecomeActive":
            if ((this.onappDidBecomeActive != null) && typeof this.onappDidBecomeActive === 'function') {
              this.onappDidBecomeActive();
            }
            break;
          default:
            return this;
        }
      }
      if ((data.response != null)) {
        switch (data.response) {
          case "params":
            this.addParams(data.params);
            break;
          default:
            return this;
        }
      }
      return this;
    },
    endBackgroundTask: function() {
      this.sendJSStatusMessage({
        request: "endBackgroundTask"
      });
      return this;
    },
    openApp: function(appId, params) {
      this.sendJSStatusMessage({
        request: "open",
        id: appId,
        params: params
      });
      return this;
    },
    close: function() {
      return this.sendJSStatusMessage({
        request: "close"
      });
    }
  };

  restrequests = {
    makeHTTPRequest: function(requestID, query) {
      return send('api', query);
      /*var json, ___iced_passed_deferral, __iced_deferrals, __iced_k;
      __iced_k = __iced_k_noop;
      ___iced_passed_deferral = iced.findDeferral(arguments);
      (function(_this) {
        return (function(__iced_k) {
          __iced_deferrals = new iced.Deferrals(__iced_k, {
            parent: ___iced_passed_deferral,
            filename: "build/precious.coffee"
          });
          _this.$.get(_this.APIURL, query, __iced_deferrals.defer({
            assign_fn: (function() {
              return function() {
                return json = arguments[0];
              };
            })(),
            lineno: 323
          }));
          __iced_deferrals._fulfill();
        });
      })(this)((function(_this) {
        return function() {
          return _this.getHTTPResponse(json);
        };
      })(this));*/
    },
    getHTTPResponse: function(json) {
      var requestID;
      if (typeof json === 'string') {
        json = JSON.parse(json);
      }
      requestID = json.requestID;
      return this.respondRequest(requestID, json);
    }
  };

  jsrequests = {
    makeJSRequest: function(requestID, query) {
      //return webkit.messageHandlers.api.postMessage(query);
      return send('api',query);
    },
    getJSResponse: function(json) { //not used by simulator
      var requestID;
      requestID = json.requestID;
      return this.respondRequest(requestID, json);
    },
    getJSStatusMessage: function(json) { //not used by simulator
      this.getStatusMessage(json);
      return this;
    },
    sendJSStatusMessage: function(json) {
      json.appId = this.APPID;
      json.appUUID = this.APPUUID;
      //return webkit.messageHandlers.status.postMessage(json);
      return send('status', json);
    },
    logError: function(error) {
      //return webkit.messageHandlers.error.postMessage(error);
      return console.error(error);
    }
  };

  log = {
    log: function(message) {
      //return webkit.messageHandlers.log.postMessage(message);
      return console.log(message);
    },
    logError: function(message) {
      //return webkit.messageHandlers.error.postMessage("App: " + this.APPID + ":" + message);
      return console.error(message);
    },
    logErrorWithTrace: function(message, url, lineNumber) {
      //return webkit.messageHandlers.error.postMessage("App: " + this.APPID + ":" + message + ", " + url + ":" + lineNumber);
      return console.error("App: " + this.APPID + ":" + message + ", " + url + ":" + lineNumber);
    },
    initErrors: function() {
      /* not needed with devTools
      var self;
      self = this;
      window.onerror = function(message, url, lineNumber) {
        self.logErrorWithTrace(message, url, lineNumber);
        return false;
      };
      return this;
      */
    }
  };


  /*
  makeRequest: (requestType, requestWay, plugin, query, callback)
  _validRequestTypes = 
    			InternalError : -1
    			SingleGet : 0
    			ContinousGet : 1
    			SinglePost : 2
    			UpdateRequest : 3
    			RemoveRequest : 4
   */

  gps = {
    getGPS: function(callback, params, userInfo) {
      _super.makeRequest(_validRequestTypes.SingleGet, 'JS', 'gps', params, callback, userInfo);
      return this;
    },
    getContinousGPS: function(callback, params, userInfo) {
      return _super.makeRequest(_validRequestTypes.ContinousGet, 'JS', 'gps', params, callback, userInfo);
    },
    stopContinousGPS: function(id, callback) {
      _super.removeRequest(id, callback);
      return this;
    }
  };

  Precious = (function(_super) {
    __extends(Precious, _super);

    function Precious($, _) {
      this.$ = $;
      this._ = _;
      this._isReady = false;
      this._documentReady = false;
      this._readyHandlers = [];
      this._sentReady = false;
      this._loadingStatus = 0;
      this._loadingTimeRequested = false;
      this.VERSION = '0.0.1';
      this.APIURL = "http://localhost:8080/api";
      this.WSURL = "ws://localhost:9000/";
      this.onclose = null;
      this.onminimize = null;
      this.onmaximize = null;
      this.onappDidEnterBackground = null;
      this.onappDidBecomeActive = null;
      if (this.plugins == null) {
        this.plugins = {};
      }
      this.plugins._super = this;
      this.addPlugin(gps);
      this.params = null;
      this.APPUUID = null;
      this.APPID = null;
      this.start();
      if (window.preciousAppID != null) {
        this.APPID = window.preciousAppID;
        delete window.preciousAppID;
      } else {
        this.logError("appID not found!");
      }
      if (window.preciousAppUUID != null) {
        this.APPUUID = window.preciousAppUUID;
        delete window.preciousAppUUID;
      } else {
        this.logError("appUUID not found!");
      }
      $(document).ready((function(_this) {
        return function() {
          if (_this._isReady) {
            return _this._sendReady();
          } else {
            return _this._documentReady = true;
          }
        };
      })(this));
      this.sendJSStatusMessage({
        request: "params"
      });
    }


    /*
    	@description adds plugin convenient methods to precious object
    	@param {object} obj namespace with convenient methods
     */

    Precious.prototype.addPlugin = function(obj) {
      var key, value;
      for (key in obj) {
        if (!__hasProp.call(obj, key)) continue;
        value = obj[key];
        this.plugins[key] = value;
      }
      return this;
    };


    /*
    	@description send ready event if no more loading time is requested
     */

    Precious.prototype._sendReady = function() {
      if (!this._loadingTimeRequested) {
        this.sendJSStatusMessage({
          request: "ready"
        });
        this._sentReady = true;
      }
      return this;
    };


    /*
    	@description internal ready event
     */

    Precious.prototype._gotReady = function() {
      var callback, _i, _len, _ref;
      this._isReady = true;
      _ref = this._readyHandlers;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        callback = _ref[_i];
        callback.call(this);
      }
      this._readyHandlers = [];
      if (this._documentReady) {
        this._sendReady();
      }
      return this;
    };


    /*
    	@description method to add ready handler
    	@param {Function} callback function which is called when Precious is ready
     */

    Precious.prototype.ready = function(callback) {
      if (typeof callback !== 'function') {
        return;
      }
      if (!this._isReady) {
        this._readyHandlers.push(callback);
      } else {
        callback();
      }
      return this;
    };


    /*
    	@description method to send loading progress to sandbox
    	@param {number} progress actual progress of loading 0 < x < 1, progress == 1 means finished
     */

    Precious.prototype.setProgress = function(progress) {
      if (progress >= 1) {
        this._loadingTimeRequested = false;
        this._sendReady();
      } else {
        this.sendJSStatusMessage({
          request: "progress",
          progress: progress
        });
      }
      return this;
    };


    /*
    	@description adds new starting params
    	@param {object} newParams current parameters
     */

    Precious.prototype.addParams = function(newParams) {
      var oldParams, p, prevParams;
      if (!this._isReady) {
        this._gotReady();
      }
      if (newParams != null) {
        p = newParams;
      } else {
        p = {};
      }
      oldParams = [];
      if (this.params != null) {
        oldParams = this.params.storedParams;
        prevParams = this.params;
        delete prevParams.storedParams;
        oldParams.push(prevParams);
      }
      p.storedParams = oldParams;
      this.params = p;
      return this;
    };


    /*
    	@description requests more time until ready event is fired
     */

    Precious.prototype.requestMoreLoadingTime = function() {
      if (this._sentReady) {
        return false;
      }
      this._loadintTimeRequested = true;
      return true;
    };

    Precious.prototype.start = function() {
      var func, key, prototypeFuncs;
      prototypeFuncs = Object.getPrototypeOf(this);
      for (key in prototypeFuncs) {
        func = prototypeFuncs[key];
        if (key.indexOf("init") === 0) {
          func.apply(this);
        }
      }
      return this;
    };

    Precious.prototype.stop = function() {
      var func, key, prototypeFuncs;
      prototypeFuncs = Object.getPrototypeOf(this);
      for (key in prototypeFuncs) {
        func = prototypeFuncs[key];
        if (key.indexOf("end") === 0) {
          func.apply(this);
        }
      }
      return this;
    };

    Precious.include(requests);

    Precious.include(restrequests);

    Precious.include(jsrequests);

    Precious.include(log);

    return Precious;

  })(Module);

  window.Precious = new Precious($, _);

}).call(this);
