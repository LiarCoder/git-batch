# git-batch

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
![Node Version](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen)

**git-batch** 是一个高效的 Git 分支管理工具，提供以下核心功能：

- 🗑️ 批量删除本地/远程分支
- 🔍 交互式分支选择界面
- 📋 显示分支最新提交信息
- ⚡ 支持多仓库操作
- 🛡️ 删除前二次确认机制

> [!IMPORTANT]
>
> - 本项目初期由 [`Copilot`](https://marketplace.visualstudio.com/items?itemName=GitHub.copilot)辅助搭建，并由个人完成初版功能。
> - 后期由 [`Cursor`](https://www.cursor.com/) + [`DeepSeek`](https://www.deepseek.com/) 提供编程辅助。
>
> 感谢 AI 赋能！🧡

## 功能亮点

- **智能过滤** - 自动忽略保护分支（master/main）
- **提交追溯** - 显示分支最后提交的哈希、时间、作者和消息
- **多仓库支持** - 可指定任意本地 Git 仓库路径
- **安全机制** - 删除前需二次确认选择的分支列表

## 安装

### 全局安装（推荐）

> [!CAUTION]
> 目前该脚本功能还不完善，<span style="color:red">**目前还处于不可用状态**</span>。所以还未发布到 `npm`，只能先通过下方的 [本地开发](#本地开发) 中的 `npm link` 方式体验功能。
>
> 或者使用下方 [项目推荐](#项目推荐) 中的工具。

```bash
npm install -g git-batch
# 或
yarn global add git-batch
```

### 本地开发

1. 克隆项目到本地：

```bash
$ git clone https://github.com/LiarCoder/git-batch.git
```

2. 进入项目目录：

```bash
$ cd git-batch
```

3. 安装依赖：

```bash
$ npm install
```

4. 链接到全局：

```bash
$ npm link
```

## 使用指南

### 基本用法

```bash
# 获取帮助
$ gb
$ gb -h
# gb --help
$ gb branches -h

# 在当前仓库操作
$ gb branches

# 指定仓库路径
$ gb branches /path/to/repo

# 包含远程分支
$ gb branches --remote
# gb branches -r

# 仅本地分支
$ gb branches --local
# gb branches -l
```

### 操作演示

```bash
$ gb branches
? 请选择要删除的分支:
>( ) l 001 *main       [a1b2c3d - chore: 更新依赖 (2024-03-15-14:30:00) <张三>]
 ( ) l 002  dev-feat   [b2c3d4e - feat: 新增功能模块 (2024-03-14-15:00:00) <李四>]
 ( ) r 003  origin/dev [c3d4e5f - fix: 修复线上问题 (2024-03-13-16:00:00) <王五>]

? 确定要继续吗？ (y/N)
```

## 路线图

- [ ] 远程分支管理功能
- [ ] Tag 管理模块
- [ ] Stash 清理功能
- [ ] 提交信息显示开关
- [ ] 交互性能优化
- [ ] NPM 官方发布

## 贡献指南

欢迎通过以下方式参与贡献：

- 提交 Issues 报告问题
- 发起 Pull Request 贡献代码
- 完善项目文档
- 分享使用经验

详见 [CONTRIBUTING.md](CONTRIBUTING.md) 文件。

## 项目推荐

关于 Git 批量操作的命令行工具，在本项目建立之前，其实我就在 GitHub 上找到一个和我的需求类似的项目：[AKclown/gbkill](https://github.com/AKclown/gbkill)。体验了一下，感觉非常不错，但是和我最初的设计并不完全一致，所以就想着自己试着去开发一款工具，同时也作为学习新技术的一次实践。

## 许可证

本项目采用 [MIT 许可证](LICENSE)，详细信息请参阅项目根目录的 LICENSE 文件。
