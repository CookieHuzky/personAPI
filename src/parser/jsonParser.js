const fs = require('fs');

var loadJSON = (filePath, callback) => {
    fs.readFile(filePath, {encoding: "ascii"}, (err, data) => {
        callback(JSON.parse(data));
    });
    
}

exports.loadJSON = loadJSON;