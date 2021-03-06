'use strict';

var path = require('path');
var defaults = require('lodash.defaults');
var through2 = require('through2');
var mkdirp = require('mkdirp');
var fs = require('graceful-fs');

var writeContents = require('./writeContents');

// 511 = 0777
var processMode = 511 & (~process.umask());

function dest(outFolder, opt, options) {
  if (typeof outFolder !== 'string' && typeof outFolder !== 'function') {
    throw new Error('Invalid output folder');
  }

  var options = defaults({}, opt, {
    cwd: process.cwd()
  });

  if (typeof options.mode === 'string') {
    options.mode = parseInt(options.mode, 8);
  }

  var cwd = path.resolve(options.cwd);
  var defaultMode = (options.mode || processMode);

  function saveFile (file, enc, cb) { console.log('dest', file.path);
    var basePath;
    if (typeof outFolder === 'string') {
      basePath = path.resolve(cwd, outFolder);
    }
    if (typeof outFolder === 'function') {
      basePath = path.resolve(cwd, outFolder(file));
    }
    var writePath = path.resolve(basePath, file.relative);
    var writeFolder = path.dirname(writePath);

    // wire up new properties
    file.stat = file.stat ? file.stat : new fs.Stats();
    file.stat.mode = (options.mode || file.stat.mode || processMode);
    file.cwd = cwd;
    file.base = basePath;
    file.path = writePath;

    // mkdirp the folder the file is going in
    mkdirp(writeFolder, defaultMode, function(err){
      if (err) {
        cb(err);
      } else {
        writeContents(writePath, file, cb);
      }
    });
  }

  return through2.obj(options || {}, saveFile);
}

module.exports = dest;
