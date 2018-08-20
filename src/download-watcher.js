const fs = require('fs');
const debug = require('debug')('download-watcher');

const matchers = [];
let watcher;

const register = (regex, getTargetCallback) => {
  watcher = watcher || watch(process.env.DOWNLOAD_DIR);
  debug('Registering matcher', regex);
  matchers.push({ regex, getTargetCallback });
};

const watch = downloadDir => {
  debug('Watching', downloadDir, 'for downloads...');
  watcher = fs.watch(downloadDir, { persistent: false }, (event, filename) => {
    let matcherIndex;
    let getTargetCallback;
    if (
      filename && 
      matchers.some((matcher, index) => { 
        matcherIndex = index; 
        getTargetCallback = matcher.getTargetCallback;
        return matcher.regex.test(filename); 
      })
    ) {
      // Remove matcher so that it matches only once:
      matchers.splice(matcherIndex, 1);

      const src = process.env.DOWNLOAD_DIR + filename;
      const dest = process.env.TARGET_DIR + getTargetCallback(filename);
      debug('Moving', src, '->', dest);

      /**
       * Cannot use rename if moving between devices
       * @see https://stackoverflow.com/questions/43206198/what-does-the-exdev-cross-device-link-not-permitted-error-mean
       */
      fs.copyFileSync(src, dest);
      fs.unlinkSync(src);
    }
  });
};

module.exports = register;