const fs = require('fs');
const util = require('util');
const logFile = fs.createWriteStream('query.log', { flags: 'a' });
const logStdout = process.stdout;

console.log = function () {
   const text = util.format.apply(null, arguments) + '\n';
   logFile.write(text);
   logStdout.write(text);
};

module.exports = {
  logQuery: (query, params) => {
    console.log('Executing query:', query);
    console.log('With parameters:', params);
  }
};