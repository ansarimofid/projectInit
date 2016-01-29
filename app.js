#!/usr/bin/env node

var fs = require("fs");
var cheerio = require('cheerio');
var path = require('path');
var arg = process.argv.slice(2)[0];
console.log("Argument:" + arg);

updateFileMap(); //Updates The Template fileMap


if (arg == 'simpleHtml') {
    createProjectStructure('simpleHtml');
} else
    return 0;

/**
 * Creates the complete project structure
 * @param  {string} projectName :Name of the project
 * @return {bool}             return true on success else false
 */
function createProjectStructure(projectName) {
    var structure;

    loadStructure(projectName, function(err, structure) {
        if (err) {
            console.log(err);
            return 0;
        }
        createFolderStructure(structure);
    });
}


/**
 * Loads the Project Structure from Json file
 * @param  {string}   projectName :name of project
 * @param  {Function} callback    :call specified function
 */
function loadStructure(projectName, callback) {
    fs.readFile(__dirname + "/lib/projectStructure/" + projectName + ".json", 'utf8', function(err, data) {
        if (err) {
            console.log(err);
            callback(err);
        }
        struct = JSON.parse(data);
        callback(null, struct);
    });
}

/**
 * Creates folder structure recursively from jsonObject 
 * @param  {object} jsonObject :hierarchy of Folder
 * @return {bool}            return true on sucess else false 
 */
function createFolderStructure(jsonObject) {
    function traverseJson(object, currPath) {
        var dirName;
        if (typeof currPath === "undefined") {
            dirName = '';
            currPath = '';
        } else {
            dirName = currPath + '/' + object.name;
            mkDir(object.name, process.cwd() + currPath);
        }

        console.log(dirName);
        for (var prop in object) {
            if (prop == 'children') {
                object.children.forEach(function(obj) {
                    traverseJson(obj, dirName);
                });
            }
            if (prop == 'file') {
                object.file.forEach(function(file) {
                    getFileMap(function(err, data) { //GEting FileMap and copying according to Specified destination
                        var name;

                         if (typeof object.name == 'undefined') {
                            name = '';
                        } else
                            name = object.name;

                        var src = data[file];
                        var dst = process.cwd() + currPath + '/' + name + '/' + file;
                        console.log(currPath + '/' + name + '/' + file);

                        if (typeof data[file] == 'undefined') {
                            fs.open(dst,"wx",function(err,fd){
                                if (err) {
                                    console.log(err);
                                    return;
                                }
                                    
                                fs.close(fd,function(err){
                                    if (err) {
                                        console.log(err);
                                        return;
                                    }
                                });
                            });
                            return;
                        }
                        copyFile(data[file], dst);
                    });
                });
            }
        }
    }

    traverseJson(jsonObject);
}



/**
 * Creates Directory For Simple Html5 Project
 * @return {boolean} return 1 on success else 0
 */
function createSimpleHtmlProject() {
    var currPath = process.cwd(),
        path = __dirname;
    mkDir('css', currPath);
    mkDir('img', currPath);
    mkDir('js', currPath);
    copyFile(path + '/lib/template/html/index.html', currPath + '/index.html');
    copyFile(path + '/lib/template/css/style.css', currPath + '/css/style.css');
    copyFile(path + '/lib/template/js/main.js', currPath + '/js/main.js');
    linkCss({});
}


/**
 * Creates Directory us FileSystem
 * @param  {string} dirName Name of The Directory to be Created
 * @param  {string} path    Path of root directory
 * @return {bool}         returns 1 on sucsess else 0
 */
function mkDir(dirName, path) {
    fs.mkdir(path + '/' + dirName, function(err) {
        if (err) {
            console.log(err);
            return 0;
        }
        return 1;
    });
}


/**
 * Copies file or directory from source to destination
 * @param  {string} src source of file/directory
 * @param  {string} dst destination of new file/directory
 * @return {bool}     returns 1 on success else 0
 */
function copyFile(src, dst) {
    readStream = fs.createReadStream(src);
    writeStream = fs.createWriteStream(dst);

    readStream.on('error', function(err) {
        console.log(err);
        return 0;
    });

    writeStream.on('error', function(err) {
        console.log(err);
        return 0;
    });

    readStream.pipe(writeStream);
}

/**
 * Reads the filemap.json and returns data as json
 * @param  {Function} callback :callback(err,result)
 */
function getFileMap(callback) {
    var dir = path.resolve(__dirname, "lib/template", "fileMap.json");

    fs.readFile(dir, function(err, data) {
        if (err) {
            console.log("Read Error");
            callback(err);
            return 0;
        }

        data = JSON.parse(data);
        callback(null, data);
    });
}

function linkCss(targetAndLink) {
    fs.open(target, 'r+', function(err, fd) {
        if (err) {
            console.log(err + '\n' + target);
            return 0;
        }

        fs.readFile(target, function(err, data) {
            if (err) {
                console.log("Read Error");
                return 0;
            }

            var $ = cheerio.load(data.toString());
            $('head').append('<link rel="stylesheet" href=' + link + '>');
            console.log($.html());
            fs.writeFile(target, $.html(), function(err) {
                if (err)
                    console.log(err);
            });
        });
    });

}

/**
 * Updates the File map of template directory
 */
function updateFileMap() {
    var dir = path.resolve(__dirname, "lib/template");
    recursiveDirList(dir, function(err, result) {
        var data = JSON.stringify(result, null, 4);
        fs.writeFile(path.resolve(dir, 'fileMap.json'), data, {
            flag: 'w'
        }, function(err) {
            if (err) {
                console.log(err);
                return;
            }
        });
    });
}

/**
 * Recursively Returns File list in directory
 * @param  {string}   dir      :directory to look for files
 * @param  {Function} callback :should contain two param (error,result)
 * @return {[type]}            :returns Javascript Object Containing file List
 */
function recursiveDirList(dir, callback) {
    var hashMap = {};
    fs.readdir(dir, function(err, items) {
        if (err) {
            console.log(err);
            return callback(err);
        }
        var listLength = items.length;
        if (!listLength) {
            return callback(null, hashMap);
        }
        items.forEach(function(file) {
            var name = file;
            file = path.resolve(dir, file);
            fs.stat(file, function(err, stat) {
                if (stat && stat.isDirectory()) {
                    recursiveDirList(file, function(err, res) {
                        if (err) {
                            console.log(err);
                            return;
                        }
                        hashMap = mergeObject(hashMap, res);
                        if (!--listLength) {
                            callback(null, hashMap);
                        }
                        return;
                    });
                } else if (stat && stat.isFile()) {
                    hashMap[name] = file;
                    if (!--listLength)
                        callback(null, hashMap);
                }
            });
        });
    });
}


/**
 * Merges two Object
 * @param  {Object} target :Target object 
 * @param  {Object} src    :Source object
 * @return {Object}        :Object containing merged objects
 */
function mergeObject(target, src) {
    for (var key in src) {
        if (src.hasOwnProperty(key)) {
            target[key] = src[key];
        }
    }
    return target;
}
