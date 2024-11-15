const http = require("http");
const { parse } = require("url");
const next = require("next");

const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0";
const port = parseInt(process.env.PORT || "3001", 10);

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
      console.log(
        "> You can access this from your host machine at http://localhost:" +
          port
      );
    });
});
