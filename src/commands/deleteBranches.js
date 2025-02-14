const { execSync } = require("child_process");
const inquirer = require("inquirer");
const chalk = require("chalk");
const ora = require("ora");
const { confirmAction, promptCheckbox } = require("../utils/interactive");

const BRANCH_IGNORE_PATTERNS = ["* master", "* main", "HEAD ->"];

module.exports = (program) => {
  program
    .command("branches")
    .description("批量删除分支")
    .option("-r, --remote", "包含远程分支")
    .option("-l, --local", "仅本地分支")
    .argument("[repoPath]", "仓库路径", process.cwd())
    .action(async (repoPath, options) => {
      const spinner = ora("正在获取分支信息...").start();

      try {
        const branches = getBranches(repoPath, options);
        spinner.stop();

        if (branches.length === 0) {
          console.log(chalk.yellow("没有找到可删除的分支"));
          return;
        }

        const selected = await promptCheckbox("请选择要删除的分支:", branches);
        if (selected.length === 0) return;

        const confirm = await confirmAction(
          `即将删除以下分支：\n${selected.map((b) => `  • ${b}`).join("\n")}`
        );

        if (confirm) {
          await deleteBranches(repoPath, selected, options);
        }
      } catch (error) {
        spinner.fail("操作失败");
        console.error(chalk.red(`错误信息: ${error.message}`));
      }
    });
};

function getBranches(repoPath, { remote, local }) {
  const command = remote
    ? "git branch -r"
    : local
    ? "git branch"
    : "git branch -a";
  return execSync(command, { cwd: repoPath })
    .toString()
    .split("\n")
    .map((b) => b.trim().replace(/^remotes\/origin\//, ""))
    .filter((b) => b && !BRANCH_IGNORE_PATTERNS.some((p) => b.includes(p)));
}

async function deleteBranches(repoPath, branches, options) {
  const deleteSpinner = ora("正在删除分支...").start();

  try {
    const deletePromises = branches.map((branch) => {
      const commands = [];
      if (!options.remote) commands.push(`git branch -D ${branch}`);
      if (options.remote) commands.push(`git push origin --delete ${branch}`);
      return Promise.all(
        commands.map((cmd) => execSync(cmd, { cwd: repoPath }))
      );
    });

    await Promise.all(deletePromises);
    deleteSpinner.succeed(`成功删除 ${branches.length} 个分支`);
  } catch (error) {
    deleteSpinner.fail("删除过程中发生错误");
    throw error;
  }
}
