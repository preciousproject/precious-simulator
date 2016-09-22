/**
 * loads config files
 * @see http://www.codedependant.net/2015/01/31/production-ready-node-configuration/
 */
"use strict";


var nconf   = require('nconf');
var path = require('path');
var fs      = require('fs');
var defaults = require('./default/paths.js');
var startup = nconf
    .argv()
    .env({separator:'__'})
    .defaults( defaults );


var configFile = startup.get('confFile');
var userConfig = startup.get('userConfig');

// purge the start up config
startup.remove('env');
startup.remove('argv');
startup.remove('defaults');
startup = null;

var conf = nconf
    .argv();

function readConfig (fPath) {
    fPath =path.resolve(fPath);
    try {
        if (fs.statSync(fPath).isDirectory()) {
            // if it is a directory, read all json files
            fs
                .readdirSync(fPath)
                .filter((file) => (/\.json$/).test(file))
                .sort((file_a, file_b) => file_a < file_b)
                .forEach((file) => {
                    var filepath = path.normalize(path.join(fPath, file));
                    conf.file(file, filepath);
                });
        } else {
            // if it is a file, read the file
            conf.file(fPath);
        }

    } catch (e) {
        if(e.code === 'ENOENT') {
            fs.writeFileSync(fPath,'{}');
            readConfig(fPath);
        }
    }
}

readConfig(userConfig);
readConfig(configFile);

//read defaults as fallback
if(configFile !== defaults.confFile)
    readConfig(defaults.confFile);


module.exports= conf;

/*
module.exports.get = (key, uuid) => {
    return conf.get(key);
};

module.exports.set = (key, value, uuid) => {
    return conf.set(key, value);
};*/
