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

        const branchChoices = branches.map((b, index) => {
          const branchInfo = formatBranchDisplayText(b, index);
          // 对于远程分支，使用完整的远程分支名查询提交信息
          const branchRefName = b.type === "r" ? `origin/${b.name}` : b.name;
          const commitInfo = getCommitInfo(repoPath, branchRefName);

          return {
            name: `${branchInfo}  ${commitInfo}`,
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
          await deleteBranches(repoPath, selected, options);
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

function getBranches(repoPath, { remote, local }) {
  const localBranches = execSync("git branch", { cwd: repoPath })
    .toString()
    .split("\n")
    .map((b) => b.trim())
    .filter((b) => b && !BRANCH_IGNORE_PATTERNS.some((p) => b.includes(p)))
    .map((b) => ({
      name: b.replace("* ", ""),
      type: "l",
      isCurrent: b.startsWith("*"),
    }));

  const remoteBranches = execSync("git branch -r", { cwd: repoPath })
    .toString()
    .split("\n")
    .map((b) => b.trim())
    .filter((b) => b && !BRANCH_IGNORE_PATTERNS.some((p) => b.includes(p)))
    .filter((b) => !b.includes("HEAD ->")) // 过滤掉 HEAD 指针
    .map((b) => {
      // 保留完整的远程分支名，如 "origin/feature-branch"
      const cleanName = b.replace(/^remotes\//, "");
      const branchName = cleanName.replace(/^origin\//, "");
      return {
        name: branchName,
        type: "r",
        fullRemoteName: cleanName,
      };
    });

  // 不进行去重合并，保持本地和远程分支分离
  let allBranches = [];

  if (!remote) {
    // 包含本地分支
    allBranches = allBranches.concat(localBranches);
  }

  if (!local) {
    // 包含远程分支
    allBranches = allBranches.concat(remoteBranches);
  }

  if (!remote && !local) {
    // 默认包含所有分支
    allBranches = [...localBranches, ...remoteBranches];
  }

  return allBranches;
}

async function deleteBranches(repoPath, branches, options) {
  const deleteSpinner = ora("正在删除分支...").start();

  try {
    // 分别处理本地和远程分支的删除
    const deletePromises = branches.map(async (branch) => {
      const commands = [];

      // 根据分支类型和用户选项决定删除命令
      if (branch.type === "l") {
        // 删除本地分支
        commands.push(`git branch -D ${branch.name}`);
      } else if (branch.type === "r") {
        // 删除远程分支
        commands.push(`git push origin --delete ${branch.name}`);
      }

      // 执行删除命令
      for (const cmd of commands) {
        try {
          execSync(cmd, { cwd: repoPath, stdio: "pipe" });
        } catch (error) {
          // 如果是远程分支不存在的错误，可以忽略
          if (!error.message.includes("does not exist")) {
            throw error;
          }
        }
      }
    });

    await Promise.all(deletePromises);
    deleteSpinner.succeed(`成功删除 ${branches.length} 个分支`);
  } catch (error) {
    deleteSpinner.fail("删除过程中发生错误");
    throw error;
  }
}

function getCommitInfo(repoPath, branchName) {
  try {
    const format = "%H|%s|%ad|%an";
    const command = `git log "${branchName}" -1 --pretty=format:"${format}" --date=format:%Y-%m-%d-%H:%M:%S`;
    const output = execSync(command, {
      cwd: repoPath,
      stdio: "pipe", // 静默执行，避免错误信息显示在控制台
    })
      .toString()
      .trim();

    const [hash, message, date, author] = output.split("|");
    return chalk.gray(
      `[${hash.slice(0, 7)} - ${message} (${date}) <${author}>]`
    );
  } catch (error) {
    // 静默处理错误，不显示在控制台
    return chalk.gray(" [无提交信息]");
  }
}
