#! /usr/bin/env node
const argv = require('minimist')(process.argv.slice(2));
const { recordFiles, getViewMap, checkChangeImageList, checkAllImageList } = require('../src/index.js');

recordFiles(argv.path || 'src/assets/');
getViewMap(argv.size).then(() => {
  if (argv.all) {
    checkAllImageList(argv);
  } else {
    checkChangeImageList(argv);
  }
});

