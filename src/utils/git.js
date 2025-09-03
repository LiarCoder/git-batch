const { execSync } = require("child_process");

/**
 * Git 操作工具类
 * 封装项目中需要用到的所有 Git 命令操作
 */
class Git {
  constructor(repoPath = process.cwd()) {
    this.repoPath = repoPath;
    this.BRANCH_IGNORE_PATTERNS = ["* master", "* main", "HEAD ->"];
  }

  /**
   * 执行 Git 命令的通用方法
   * @param {string} command - Git 命令
   * @param {Object} options - 执行选项
   * @returns {string} 命令输出结果
   */
  _execGitCommand(command, options = {}) {
    const defaultOptions = {
      cwd: this.repoPath,
      stdio: "pipe", // 静默执行
      encoding: "utf8",
      ...options,
    };

    try {
      return execSync(command, defaultOptions).toString().trim();
    } catch (error) {
      if (options.throwOnError !== false) {
        throw error;
      }
      return null;
    }
  }

  /**
   * 获取本地分支列表
   * @returns {Array} 本地分支信息数组
   */
  getLocalBranches() {
    const output = this._execGitCommand("git branch");

    return output
      .split("\n")
      .map((b) => b.trim())
      .filter(
        (b) => b && !this.BRANCH_IGNORE_PATTERNS.some((p) => b.includes(p))
      )
      .map((b) => ({
        name: b.replace("* ", ""),
        type: "l",
        isCurrent: b.startsWith("*"),
      }));
  }

  /**
   * 获取远程分支列表
   * @returns {Array} 远程分支信息数组
   */
  getRemoteBranches() {
    const output = this._execGitCommand("git branch -r");

    return output
      .split("\n")
      .map((b) => b.trim())
      .filter(
        (b) => b && !this.BRANCH_IGNORE_PATTERNS.some((p) => b.includes(p))
      )
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
  }

  /**
   * 获取分支列表（根据选项过滤）
   * @param {Object} options - 分支过滤选项
   * @param {boolean} options.remote - 仅包含远程分支
   * @param {boolean} options.local - 仅包含本地分支
   * @returns {Array} 分支信息数组
   */
  getBranches({ remote = false, local = false } = {}) {
    let allBranches = [];

    if (!remote) {
      // 包含本地分支
      allBranches = allBranches.concat(this.getLocalBranches());
    }

    if (!local) {
      // 包含远程分支
      allBranches = allBranches.concat(this.getRemoteBranches());
    }

    if (!remote && !local) {
      // 默认包含所有分支
      allBranches = [...this.getLocalBranches(), ...this.getRemoteBranches()];
    }

    return allBranches;
  }

  /**
   * 获取分支的最新提交信息
   * @param {string} branchName - 分支名称
   * @returns {Object|null} 提交信息对象或 null
   */
  getCommitInfo(branchName) {
    try {
      const format = "%H|%s|%ad|%an";
      const command = `git log "${branchName}" -1 --pretty=format:"${format}" --date=format:%Y-%m-%d-%H:%M:%S`;
      const output = this._execGitCommand(command);

      if (!output) return null;

      const [hash, message, date, author] = output.split("|");
      return {
        hash: hash?.slice(0, 7) || "",
        message: message || "",
        date: date || "",
        author: author || "",
        fullHash: hash || "",
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * 删除本地分支
   * @param {string} branchName - 分支名称
   * @param {boolean} force - 是否强制删除
   * @returns {boolean} 删除是否成功
   */
  deleteLocalBranch(branchName, force = true) {
    try {
      const flag = force ? "-D" : "-d";
      this._execGitCommand(`git branch ${flag} ${branchName}`);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 删除远程分支
   * @param {string} branchName - 分支名称
   * @param {string} remote - 远程名称，默认为 origin
   * @returns {boolean} 删除是否成功
   */
  deleteRemoteBranch(branchName, remote = "origin") {
    try {
      this._execGitCommand(`git push ${remote} --delete ${branchName}`);
      return true;
    } catch (error) {
      // 如果是远程分支不存在的错误，认为删除成功
      if (error.message && error.message.includes("does not exist")) {
        return true;
      }
      return false;
    }
  }

  /**
   * 批量删除分支
   * @param {Array} branches - 分支信息数组
   * @returns {Object} 删除结果统计
   */
  async deleteBranches(branches) {
    const results = {
      success: [],
      failed: [],
      total: branches.length,
    };

    for (const branch of branches) {
      let success = false;

      if (branch.type === "l") {
        success = this.deleteLocalBranch(branch.name);
      } else if (branch.type === "r") {
        success = this.deleteRemoteBranch(branch.name);
      }

      if (success) {
        results.success.push(branch);
      } else {
        results.failed.push(branch);
      }
    }

    return results;
  }

  /**
   * 检查是否为有效的 Git 仓库
   * @returns {boolean} 是否为有效的 Git 仓库
   */
  isValidRepository() {
    try {
      this._execGitCommand("git rev-parse --git-dir");
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 获取当前分支名称
   * @returns {string|null} 当前分支名称
   */
  getCurrentBranch() {
    try {
      return this._execGitCommand("git branch --show-current");
    } catch (error) {
      return null;
    }
  }

  /**
   * 获取仓库状态
   * @returns {Object} 仓库状态信息
   */
  getStatus() {
    try {
      const status = this._execGitCommand("git status --porcelain");
      const currentBranch = this.getCurrentBranch();

      return {
        currentBranch,
        hasChanges: status.length > 0,
        changes: status.split("\n").filter((line) => line.trim()),
      };
    } catch (error) {
      return {
        currentBranch: null,
        hasChanges: false,
        changes: [],
      };
    }
  }
}

module.exports = Git;
