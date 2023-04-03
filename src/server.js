#!/usr/bin/env node

import { WebSocketServer } from "ws";
import { parseArgs } from "node:util";
import chokidar from "chokidar";
import { readFileSync } from "node:fs";

const options = {
  port: {
    type: "string",
  },
  root: {
    type: "string",
  },
};

const { values } = parseArgs({
  args: process.argv.slice(2),
  options,
});

const config = Object.assign(
  {
    target: "localhost",
    port: 8080,
  },
  values
);

const wss = new WebSocketServer({ port: config.port });

if (config.root) {
  chokidar.watch(config.root).on("change", (path) => {
    console.log("Change detected: ", path);
    for (const ws of wss.clients) {
      ws.send(
        JSON.stringify({
          type: "change",
          content: readFileSync(path, "utf8"),
          path,
        })
      );
    }
  });
  console.log("Watching: ", config.root);
}

wss.on("connection", function connection(ws) {
  ws.on("error", console.error);
  ws.on("message", function message(data) {
    console.log("received: %s", data);
  });
  console.log("Connected to client");
});
