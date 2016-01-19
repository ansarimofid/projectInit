#!/usr/bin/env node

var arg = process.argv.slice(2)[0];
console.log("Argument:" + arg);


if (arg == 'simpleHtmlProject') {
    createSimpleHtmlProject();
}
else
    return 0;


function createSimpleHtmlProject() {
    var fs = require("fs-extra"),
        currPath = process.cwd();
    mkDir('css',currPath);
    mkDir('img',currPath);
    mkDir('js',currPath);
}

function mkDir(dirName,path){
    var fs = require("fs");
    fs.mkdir(path+'/'+dirName, function(err){
        if (err){
            console.log(err);
            return 0;
        }
        return 1;
    });
}