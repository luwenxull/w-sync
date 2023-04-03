#!/usr/bin/env node

import WebSocket from "ws";
import { parseArgs } from "node:util";
import chokidar from "chokidar";
import { writeFile } from "node:fs";

const options = {
  target: {
    type: "string",
  },
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

const ws = new WebSocket(`ws://${config.target}:${config.port}`);

ws.on("error", console.error);

ws.on("open", function open() {
  if (config.root) {
    chokidar.watch(config.root).on("change", (path) => {
      console.log("Change detected: ", path);
      ws.send(path);
    });
    console.log("Watching: ", config.root);
  }
  console.log("Connected to server");
});

ws.on("message", function message(data) {
  try {
    const { type, content, path } = JSON.parse(data);
    if (type === "change") {
      console.log("Change detected: ", path)
      writeFile(path, content, (err) => {
        if (err) {
          console.error(err);
        }
      })
    }
  } catch (e) {
    console.error(e);
  }
});
