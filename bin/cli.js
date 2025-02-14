#!/usr/bin/env node

const { Command } = require("commander");
const { createCommand } = require("../src/commands");
const packageJson = require("../package.json");
const chalk = require("chalk");

const program = new Command();

program
  .name(packageJson.name)
  .description(
    chalk.cyan(
      `${packageJson.name}@${packageJson.version}\n${packageJson.description}`
    )
  )
  .version(packageJson.version)
  .configureOutput({
    outputError: (str, write) => write(chalk.red(str)),
  });

// 注册子命令
createCommand(program);

program.parse(process.argv);
