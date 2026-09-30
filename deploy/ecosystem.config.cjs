const path = require("node:path");

module.exports = {
  apps: [{
    name: "nuhoxy",
    cwd: path.resolve(__dirname, ".."),
    script: "node_modules/.bin/next",
    args: "start",
    interpreter: "node",
    env: {
      NODE_ENV: "production",
      PORT: "3013",
      HOST: "127.0.0.1",
    },
  }],
};
