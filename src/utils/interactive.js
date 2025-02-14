const inquirer = require("inquirer");
const chalk = require("chalk");

exports.promptCheckbox = async (message, choices) => {
  const { selected } = await inquirer.prompt([
    {
      type: "checkbox",
      name: "selected",
      message,
      choices: choices.map((c) => ({
        name: c.name,
        value: c.value.raw, // 存储原始分支名称
      })),
      pageSize: Math.min(20, choices.length),
    },
  ]);
  return selected;
};

exports.confirmAction = async (message) => {
  const { confirm } = await inquirer.prompt([
    {
      type: "confirm",
      name: "confirm",
      message: chalk.yellow(`${message}\n确定要继续吗？`),
      default: false,
    },
  ]);
  return confirm;
};
