const fs = require('fs');

const sslOptions = {
  key: fs.readFileSync('/opt/apps/ssl/server.key'),
  cert: fs.readFileSync('/opt/apps/ssl/server.cert'),
};

module.exports = sslOptions;