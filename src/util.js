const fs = require('fs');
const join = require('path').join;

function readFile(path) {
    let totalFiles = [];
    function read(path) {
        let files = fs.readdirSync(path);

        files.forEach((item) => {
            let fPath = join(path, item);
            let stat = fs.statSync(fPath);
            if (stat.isDirectory()) {
                read(fPath, cb)
            } else {
                totalFiles.push(fPath);
            }
        });
    }
    read(path);
    return totalFiles;
}

module.exports = {
    readFile
}