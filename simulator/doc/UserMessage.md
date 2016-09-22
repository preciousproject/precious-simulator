# User Message
Singleton to show a specific message to the user.
The messages can be divided into two categories: persistent and non-persistent.
Non-persistent Messages dissapear after a specified amount of time automatically, but they can also be dismissed by the user manually.

```javascript
const userMessage = require('./path/to/file');
userMessage.show({msg:'...'});
```

## Methods
### setAlertTime(time)
Sets the global Time how long a non-persistent message is shown in milliseconds.

* Arguments
    * `time` time how long a message is shown
* Returns
    * `undefined`

```javascript
//sets global alert time to 1s
userMessage.setAlertTime(1000);
```

### getAlertTime()
Returns the global alert time. Default is 3000 ms.

* Returns
     * global alert time

```javascript
//gets global alert time
//default returns 3000
var alertTime = userMessage.getAlertTime();
```

### show(args)
Shows a given message to the user.

* Arguments
    * `args` Object which specifies message and appearance
        * `msg` String, message
        * `persistent` Bool, defines if message is persistant
        * `type` String, type of message, influences background color, default is warning
            * `warning`
            * `error`
            * `info`
            * `success`
        * `header` String, header text of message, is shown bold, default is dependent of `type`
        * `time` number, time until message disappears, is ignored if persistent is true
* Returns
    * `undefined`
        
```javascript
//displays a yellow warning messagebox with the message: "Warning! example message"
//"Warning!" is printed bold
//it dissapears after 3 seconds
userMessage.show({msg: 'example message'});

// displays "Hey! example message 2"
userMessage.show({
  msg: 'example message 2', //message
  time: 5000, //time until it dissapears
  type: info, //blue background
  header: 'Hey!' //preceedes the message and is written bold
  });
```