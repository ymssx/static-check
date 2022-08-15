// const md5 = require('md5');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const chalk = require('chalk');
const { createCanvas, Image } = require('canvas');
const sgf = require("staged-git-files");

function getDiffFileList() {
  return new Promise((resolve, reject) => {
    sgf(function(err, results) {
      if (err) {
        return reject(err);
      }
      resolve(results);
    });
  });
}

// 过滤掉删除的
function getChangeFileList() {
  return getDiffFileList()
    .then(results => {
      return results
      .filter(item => item.status !== 'Deleted')
      .map(item => item.filename)
    });
}



const fileList = [];
function recordFiles(currentDirPath) {
  const list = fs.readdirSync(currentDirPath, { withFileTypes: true });

  for (const dirent of list) {
    const filePath = path.join(currentDirPath, dirent.name);
    if (dirent.isFile()) {
      if (!(/.*\.(png|jpeg|jpg|svg)/).test(dirent.name)) {
        continue;
      }
      fileList.push({ name: dirent.name, path: filePath });
    } else if (dirent.isDirectory()) {
      recordFiles(filePath);
    }
  }
}

// function getFileContent(filePath) {
//   return new Promise((resolve, reject) => {
//     fs.readFile(filePath, function(err, buf) {
//       if (err) {
//         return reject(err);
//       }
//       resolve(buf);
//     });
//   })
// }


// const fileMap = {};
// const repeatMap = {};

// 检查内容是否完全一样
// async function checkRepeatFiles() {
//   for (const { name, path } of fileList) {
//     const token = md5(await getFileContent(path));
  
//     if (fileMap[token]) {
//       if (!repeatMap[token]) {
//         repeatMap[token] = [fileMap[token]];
//       }
//       repeatMap[token].push(name);
//       return;
//     }
    
//     fileMap[token] = name;
//   }

//   console.log(repeatMap);
// }


async function getFileView(filePath, size = 20) {
  const pic = await sharp(filePath)
    .trim()
    .resize(size, size)
    // .greyscale()
    .png()
    .toBuffer();

  return new Promise((resolve, reject) => {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, size, size);
      resolve(ctx.getImageData(0, 0, size, size));
    };
    img.onerror = err => { reject(err) };
    img.src = pic;
  });
}

const viewMap = {};
async function getViewMap(size) {
  for (const { path } of fileList) {
    try {
      const view = await getFileView(path, size);
      viewMap[path] = view.data;
    } catch(e) {
      // console.log(path, e);
    }
  };
}


function getChangeImageList() {
  return getChangeFileList()
    .then(list => list.filter(item => (/src\/assets\/svg/i).test(item)));
}


async function checkSimiliarFile(list, { distance = 10, threshold = 0.9 }) {
  const hasCheck = [];
  let hasError = false;

  for (const item of list) {
    const view = viewMap[item];
    if (!view) {
      continue;
    }

    const len = view.length;
    for (const { path } of fileList) {
      const oldView = viewMap[path];
      if (path === item || hasCheck.includes(path) || !oldView) {
        continue;
      }
      let count = 0;
      for (let i = 0; i < len; i += 1) {
        if (Math.abs(oldView[i] - view[i]) < distance) {
          count += 1;
        }
      }

      if (count > len * threshold) {
        console.error(chalk.red(`The similarity of these two pictures is ${chalk.blue(Math.round(100 * count / len))}`));
        console.error(`  - ${chalk.green('new:')} ${item}`);
        console.error(`  - ${chalk.yellow('exsited:')} ${path}`);
        hasError = true;
      }
    }

    hasCheck.push(item);
  }

  if (hasError) {
    process.exit(1);
  }
}

// 检查文件是否超出尺寸
function checkFileSize(list, maxSize = 150) {
  const errorMap = {};
  for (const path of list) {
    const status = fs.statSync(path) || {};
    if (status.size > maxSize * 1000) {
      errorMap[path] = status.size;
    }
  }
  if (Object.keys(errorMap).length) {
    console.error(chalk.red(`These files exceed the ${maxSize}kb size limit:`));
    for (const path in errorMap) {
      console.error(`  - ${chalk.red(Math.round(errorMap[path] / 1000 + 'kb'))} ${chalk.blue(path)}`);
    }
    process.exit(1);
  }
}


async function checkChangeImageList(config = {}) {
  const list = await getChangeImageList();
  if (config.limitSize) {
    checkFileSize(list, config.maxSize);
  }
  checkSimiliarFile(list, config);
}

function checkAllImageList(config = {}) {
  const list = fileList.map(item => item.path);
  if (config.limitSize) {
    checkFileSize(list, config.maxSize);
  }
  checkSimiliarFile(list, config);
}


module.exports = {
  recordFiles,
  getViewMap,
  checkChangeImageList,
  checkAllImageList,
};
