# Main
Entry point of application.  
Manages communication between Simulator and Main window. 

## Listener IPC Channels
### main-window-ready
Closes Loading Window and shows Main Window. Intended to be used once upon `document ready` event by mainWindow.js.

### start-simulator
Starts a Simulator.
If Simulator already running, e.g. by repeatedly pressing the start Button without changing app path, the simulator window is focused but not reloaded.
If another app is running, the currently running app is terminated, so no messages closing messages are sent, and the new app is started.

##### Arguments

* `path` Absolute path of the app.

### close-simulator
Closes currently open simulator window.

### open-file
Opens a File-Open dialog

##### Arguments
Arguments for the open file dialog. [See here](https://github.com/atom/electron/blob/master/docs/api/dialog.md#dialogshowopendialogbrowserwindow-options-callback)

### get-config
Gets the value from the config file, or the default value if not found, and if no default value is given false is returned.

##### Arguments
Is an object containing following keys

* `key` the key to the value
* `default` default value to be returned if key not found in config, if not set and key not found, false is returned.

an Array of such objects can also be provided, in that case all keys are searched seperatly, but returned in on associative array, key is always the last part of the key-path.
e.g.:

```javascript
ipc.sendSync([
    {key: "obj:k1", default: 1},
    {key: "obj:k2:k3", default: 2}
    ]);
/* returns

    {
        k1: 1,
        k3: 2
    }
*/
```

### set-config
Sets a key-value pair in userConfig.
All new set values are stored in memory until application is closed, at which point they are written to the hard drive.

##### Arguments
Is an object containing following keys

* `key` the key to the value
* `value` the value itself

### precious-message
Forwards given Precious request to request handling in main window.
Intended to be called from the simulator window.

##### Arguments
Is an object containing following keys

* `api` specifies which api should be used, possible values
    * `api` for an api request
    * `status` for a status update
* `data` raw precious request

## Send IPC Channels
### Main Window
### Simulator Window