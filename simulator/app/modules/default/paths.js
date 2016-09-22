const app = require('electron').app;
const path = require('path');
function getRessourcePath() {
    return app.getPath("userData");
}

module.exports = {
    confFile : path.join(app.getAppPath(), "config/"),
    userConfig : path.join(getRessourcePath(),'userConfig.json')
};
