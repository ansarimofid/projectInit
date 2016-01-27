#!/usr/bin/env node

var fs = require("fs-extra");
var cheerio = require('cheerio');

var arg = process.argv.slice(2)[0];
console.log("Argument:" + arg);


if (arg == 'simpleHtml') {
    // createSimpleHtmlProject();
    createProjectStructure('simpleHtml');
} else
    return 0;

function createProjectStructure(projectName){
    var structure;
    structure = loadStructure(projectName);
    createFolderStructure(structure);
}

function createFolderStructure(jsonObject){

    function traverseJson(object, currPath) {
        var dirName;
        if (typeof currPath === "undefined") {
            dirName = '';
        } else {
            dirName = currPath + '/'+object.name;
            mkDir(object.name,process.cwd()+currPath);
        }

        console.log(dirName);
        for (var prop in object) {
            if (prop == 'children') {
                object.children.forEach(function(obj) {
                    traverseJson(obj, dirName);
                });
            }
        }
    }

    traverseJson(jsonObject);
}   


function loadStructure(projectName) {
    var struct;

    /*fs.readFile(__dirname + "/lib/projectStructure/" + projectName + ".json", 'utf8', function(err, data) {
        if (err) {
            console.log(err);
        }
        struct = JSON.parse(data);
        // console.log(struct);

        function traverseJson(object, currPath) {
            var dirName;
            if (typeof currPath === "undefined") {
                dirName = '';
            } else {
                dirName = currPath + '/'+object.name;
                mkDir(object.name,process.cwd()+currPath);
            }

            console.log(dirName);
            for (var prop in object) {
                if (prop == 'children') {
                    object.children.forEach(function(obj) {
                        traverseJson(obj, dirName);
                    });
                }
            }
        }
        traverseJson(structure);
        console.log(struct);

        // return data;
        return {"name":"Janju"};
    });*/

    struct = JSON.parse(fs.readFileSync(__dirname + "/lib/projectStructure/" + projectName + ".json", 'utf8'));
    return struct;
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
 * @return {bool}     returns 1 on success else 1
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

function linkCss(targetAndLink) {
    fs.open(target, 'r+', function(err, fd) {
        if (err) {
            console.log(err + '\n' + target);
            return 0;
        }

        fs.readFile(target, function(err, data) {
            if (err)
                console.log("Read Error");

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
