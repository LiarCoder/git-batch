const path = require("path");
const fs = require("fs");

module.exports.createCommand = (program) => {
  const commandsPath = __dirname;

  fs.readdirSync(commandsPath)
    .filter((file) => file.endsWith(".js") && file !== "index.js")
    .forEach((file) => {
      const commandModule = require(path.join(commandsPath, file));
      commandModule(program);
    });
};
