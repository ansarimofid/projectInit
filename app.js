#!/usr/bin/env node

var fs = require("fs-extra");
var cheerio = require('cheerio');
var path = require('path');
var arg = process.argv.slice(2)[0];
var program = require('commander');
var minimist = require('minimist');
var mArgv = minimist(process.argv.slice(2));
var exec = require('child_process').exec;

console.log("Argument:" + arg);

program.version('v0.0.1')
    .option('-L, --lib', 'Load Library to current directory')
    .option('-LA, --libAdd', 'Add Library to collection')
    .option('-LR, --libRemove', 'Remove Library from Collection')
    .option('-LR, --libUpdate', 'Remove Library')
    .option('-AS, --addStruct', 'Adds Directory Structures')
    .option('-LL, --libList', 'Displays List of Avialbale Libraries')
    .parse(process.argv);

/**
 * Adds library to current directory directly from cmd arguments.
 * Trigger with flag --lib
 */
if (mArgv.lib) {
    var libArr = mArgv.lib.split(',');
    console.log(libArr);
    libArr.forEach(function(lib) {
        isLibAvialable(lib, function(err, res) {
            if (err) {
                console.log(err);
                return;
            }
            if (res) {
                copyLib(lib, process.cwd());
            } else
                console.log("Error: Library " + "'" + lib + "'" + " Doesn't Exist");
        });

    });
    return;
}



/**
 * Add new packages to Library collection
 * Trigger with flag --libAdd
 */
if (mArgv.libAdd) {
    var libArr = mArgv.libAdd.split(',');
    console.log(libArr);
    libArr.forEach(function(lib) {
        isLibAvialable(lib, function(err, res) {
            if (err) {
                console.error(err);
                return;
            }
            if (!res)
                execCmd('npm install ' + lib + ' --save');
            else
                console.log(lib + " Already Exist");
        });
    });
    return;
}

/**
 * Removes packages from Library collection
 * Trigger with flag --libRemove
 */
if (mArgv.libRemove) {
    var libArr = mArgv.libRemove.split(',');
    console.log(libArr);
    libArr.forEach(function(lib) {
        isLibAvialable(lib, function(err, res) {
            if (err) {
                console.error(err);
                return;
            }
            if (res)
                execCmd('npm uninstall ' + lib + ' --save');
            else
                console.log(lib + " Doesn't Exist");
        });
    });
    return;
}


/**
 * trigger with flag --libUpdate
 * Updates package.json dependencies to latest
 */
if (mArgv.libUpdate) {
    execCmd('ncu -u --loglevel verbose --packageFile package.json');
    // execCmd('npm update');
    return;
}

/**
 * trigger with flag --addStruct
 * Adds Manually Created Json based directoryStructure in directoryStructure Library
 */
if (mArgv.addStruct) {
    var src = mArgv.addStruct;
    var dst = path.resolve(__dirname, "lib/projectStructure", path.basename(src));

    if (path.extname(src).toLowerCase() == '.json') {
        if (path.isAbsolute(src))
            copyFile(src, dst);
        else
            copyFile(path.join(process.cwd(), src), dst);
    } else
        console.log("Error: Not a Json File");
    return;
}

if (mArgv.libList) {
    getLibList();
    return;
}
updateFileMap(); //Updates The Template fileMap

/**
 * Trigger with CLI argument
 * Creates Directory Structure
 */
if (arg) {
    createProjectStructure(arg);
} else
    return 0;


/**
 * Executes exec command
 * @param  {string} cmd [terminal command]
 */
function execCmd(cmd) {
    process.chdir(__dirname);
    exec(cmd, function(err, stdout, stderr) {

        if (err) {
            console.log('Error:' + err);
            return;
        }
        console.log(stderr);
        console.log(stdout);
    });
}

/**
 * Creates the complete project structure
 * @param  {string} projectName :Name of the project
 * @return {bool}             return true on success else false
 */
function createProjectStructure(projectName) {
    var structure;

    loadJson(__dirname + "/lib/projectStructure/" + projectName + ".json", function(err, structure) {
        if (err) {
            console.log(err);
            return 0;
        }
        createFolderStructure(structure);
    });
}


/**
 * Parses the Json file
 * @param  {string}   path :path to json file
 * @param  {Function} callback    :call specified function
 */
function loadJson(path, callback) {
    fs.readFile(path, 'utf8', function(err, data) {
        if (err) {
            console.log(err);
            callback(err);
            return;
        }
        struct = JSON.parse(data);
        callback(null, struct);
    });
}

/**
 * Print The List of Available Libraries
 */
function getLibList() {
    loadJson(path.resolve(__dirname, 'package.json'), function(err, data) {
        if (err) {
            console.log(err);
            return;
        }
        if (data.dependencies) {
            console.log("\tList of Libraries");
            console.log("Library \t\t Version");
            for (var lib in data.dependencies) {
                console.log(lib + '\t\t' + data.dependencies[lib]);
            }
        } else {
            console.log("No Avialbale Libraries");
        }
        return;
    });
}

/**
 * Checks if certain library is available or not
 * @param  {string}   libname  :name of library to check for
 * @param  {Function} callback
 */
function isLibAvialable(libname, callback) {
    loadJson(path.resolve(__dirname, 'package.json'), function(err, data) {
        if (err) {
            console.log(err);
            callback(err);
            return;
        }
        if (data.dependencies[libname])
            callback(null, 1);
        else
            callback(null, 0);
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
                })
            } else if (prop == 'file') {
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
                            fs.open(dst, "wx", function(err, fd) {
                                if (err) {
                                    console.log(err);
                                    return;
                                }

                                fs.close(fd, function(err) {
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
            } else if (prop == 'lib' && typeof object.lib == 'object') {
                var dst = process.cwd() + currPath + '/' + object.name;
                // mkDir("lib", dst);
                object.lib.forEach(function(lib) {
                    isLibAvialable(lib, function(err, res) {
                        if (err) {
                            console.log(err);
                            return;
                        }
                        if (res) {
                            copyLib(lib, dst);
                            console.log(currPath + '/' + object.name + '/lib/' + lib);
                        }
                    });
                });
            }
        }
    }

    traverseJson(jsonObject);
}

/**
 * Copies the library to specified destination
 * @param  {string} lib [name of library to import]
 * @param  {string} dst [path to destination folder]
 * @return {bool}  return tru on success else false
 */
function copyLib(lib, dst) {
    if (!copyFile(__dirname + "/node_modules" + '/' + lib, dst + '/' + lib))
        return 0;
    return 1;
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
    fs.copy(src, dst, function(err) {
        if (err) {
            console.log(err);
            return 0;
        }
        return 1;
    });
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
