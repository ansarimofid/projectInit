#!/usr/bin/env node

var fs = require("fs-extra");
var cheerio = require('cheerio');

var arg = process.argv.slice(2)[0];
console.log("Argument:" + arg);


if (arg == 'simpleHtmlProject') {
    createSimpleHtmlProject();
} else
    return 0;



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
    linkCss(path + '/lib/template/html/index.html',currPath + '/index.html', 'css/style.css');
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
    fs.copy(src, dst, function(err) {
        if (err) {
            console.log(err);
            return 0;
        }
        return 1;
    });
}

function linkCss(src,target, link) {

    fs.open(src, 'r+', function(err, fd) {
        if (err)
            console.log(err);

        fs.readFile(src, function(err, data) {
            if (err)
                console.log(err);

            var $ = cheerio.load(data.toString());
            $('head').append('<link rel="stylesheet" href='+link+'>');
            console.log($.html());
            fs.writeFile(target, $.html(), function(err){
                if (err)
                    console.log(err);
            });
        });
    });

}
