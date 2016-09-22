(()=> {
    "use strict";
//////////////////////////////////////// Start simulator overhead
    //window.$ = window.jQuery = require('jquery');

    window._ = require('underscore');
    window.preciousAppID = 0;
    window.preciousAppUUID = "";
    const ipc = require('electron').ipcRenderer;
    var logStatus = (headerPrefix, msg) => {

        console.groupCollapsed(headerPrefix + (msg.request || msg.response));
        console.log(msg);
        console.groupEnd();
    };
    var send = (api, data) => {
        "use strict";
        if (api === 'status') {
            logStatus('Status Message sent: ', data);
        }
        ipc.send('precious-message', {api: api, data: data});
    };
    ipc.on('precious-response', (event, args) => {
        "use strict";
        var requestID;
        requestID = args.requestID;
        return window.Precious.respondRequest(requestID, args);
    });

    ipc.on('precious-status', (event, args) => {
        logStatus('Status Message received: ', args);

        window.Precious.getStatusMessage(args);
    });

//definition needed for constructor to succeed
    window.webkit = {
        messageHandlers: {
            api: {
                postMessage: (query)=> {
                    return send('api', query);
                }
            },
            status: {
                postMessage: (json)=> {
                    return send('status', json);
                }
            },
            error: {
                postMessage: (message)=> {
                    console.error(message)
                    console.trace();
                }
            },
            log: {
                postMessage: (message)=> {
                    console.log(message);
                }
            }
        }
    };

//////////////////////////////////////// end simulator overhead

//require basic precious Library
    require('./precious');

//delete temp object
    //delete window.webkit;

//override Default Precious Methods
    window.Precious.makeHTTPRequest = function (requestID, query) {
        return send('api', query);
    };
    window.Precious.initErrors = function () {
    };
})();
