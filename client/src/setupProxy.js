const proxy = require("http-proxy-middleware");

module.exports = function(app) {
  app.use(proxy("/logsindexnew", { target: "http://localhost:9200/" }));
};
