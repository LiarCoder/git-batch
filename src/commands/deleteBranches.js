const chalk = require("chalk");
const ora = require("ora");
const { confirmAction, promptCheckbox } = require("../utils/interactive");
const Git = require("../utils/git");

module.exports = (program) => {
  program
    .command("branches")
    .description("批量删除分支")
    .option("-r, --remote", "包含远程分支")
    .option("-l, --local", "仅本地分支")
    .argument("[repoPath]", "仓库路径", process.cwd())
    .action(async (repoPath, options) => {
      const git = new Git(repoPath);
      const spinner = ora("正在获取分支信息...").start();

      try {
        // 验证是否为有效的 Git 仓库
        if (!git.isValidRepository()) {
          spinner.fail("错误：指定路径不是有效的 Git 仓库");
          return;
        }

        const branches = git.getBranches(options);
        spinner.stop();

        if (branches.length === 0) {
          console.log(chalk.yellow("没有找到可删除的分支"));
          return;
        }

        const branchChoices = branches.map((b, index) => {
          const branchInfo = formatBranchDisplayText(b, index);
          // 对于远程分支，使用完整的远程分支名查询提交信息
          const branchRefName = b.type === "r" ? `origin/${b.name}` : b.name;
          const commitInfo = git.getCommitInfo(branchRefName);
          const commitDisplay = formatCommitInfo(commitInfo);

          return {
            name: `${branchInfo}  ${commitDisplay}`,
            value: b,
          };
        });

        const selected = await promptCheckbox(
          "请选择要删除的分支:",
          branchChoices
        );
        if (selected.length === 0) return;

        const confirm = await confirmAction(
          `即将删除以下分支：\n${selected
            .map((b) => `  • ${b.name}`)
            .join("\n")}`
        );

        if (confirm) {
          await deleteBranchesWithGit(git, selected);
        }
      } catch (error) {
        spinner.fail("操作失败");
        console.error(chalk.red(`错误信息: ${error.message}`));
      }
    });
};

function formatBranchDisplayText(branch, index) {
  const branchIndex = (index + 1).toString().padStart(3, "0");
  const branchName = branch.isCurrent
    ? `${chalk.green("*")}${branch.name}`
    : ` ${branch.name}`;

  const branchFormats = {
    local: `l ${branchIndex} ${branchName}`,
    remote: `${chalk.red(`r ${branchIndex}`)} ${branchName}`,
    current: `${chalk.green(`l ${branchIndex}`)} ${branchName}`,
  };

  if (branch.isCurrent) {
    return branchFormats.current;
  } else if (branch.type === "r") {
    return branchFormats.remote;
  } else if (branch.type === "l") {
    return branchFormats.local;
  }
}

/**
 * 格式化提交信息显示
 * @param {Object|null} commitInfo - 提交信息对象
 * @returns {string} 格式化后的提交信息字符串
 */
function formatCommitInfo(commitInfo) {
  if (!commitInfo) {
    return chalk.gray(" [无提交信息]");
  }

  const { hash, message, date, author } = commitInfo;
  return chalk.gray(`[${hash} - ${message} (${date}) <${author}>]`);
}

/**
 * 使用 Git 类删除分支
 * @param {Git} git - Git 实例
 * @param {Array} branches - 要删除的分支列表
 */
async function deleteBranchesWithGit(git, branches) {
  const deleteSpinner = ora("正在删除分支...").start();

  try {
    const results = await git.deleteBranches(branches);

    if (results.failed.length > 0) {
      deleteSpinner.warn(
        `删除完成：成功 ${results.success.length} 个，失败 ${results.failed.length} 个`
      );
      console.log(chalk.yellow("删除失败的分支："));
      results.failed.forEach((branch) => {
        console.log(chalk.yellow(`  • ${branch.name}`));
      });
    } else {
      deleteSpinner.succeed(`成功删除 ${results.success.length} 个分支`);
    }
  } catch (error) {
    deleteSpinner.fail("删除过程中发生错误");
    throw error;
  }
}
