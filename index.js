
const http = require("node:http");

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/plain; charset=utf-8"
  });

  res.end("Hyper Uptime test botu aktif!");
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Test sunucusu ${PORT} portunda calisiyor.`);
});
