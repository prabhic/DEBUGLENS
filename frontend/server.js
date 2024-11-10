const http = require("http");
const { parse } = require("url");
const next = require("next");

const dev = false; // Force production mode
const hostname = "localhost";
const port = 3001;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  http
    .createServer((req, res) => {
      const parsedUrl = parse(req.url, true);
      handle(req, res, parsedUrl);
    })
    .listen(port, hostname, (err) => {
      if (err) throw err;
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
