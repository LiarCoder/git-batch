#!/usr/bin/env node

const { Command } = require('commander');
const { deleteBranches } = require('../src/commands/deleteBranches');
const packageJson = require('../package.json');

const program = new Command();

program
    .name(packageJson.name)
    .description(`${packageJson.name}@${packageJson.version}\n${packageJson.description}`)
    .version(packageJson.version)
    .option('-r, --remote', '仅删除远程分支')
    .argument('[repoPath]', '仓库路径', process.cwd())
    .action(async (repoPath, options) => {
        console.log('欢迎使用 git-batch 工具！');
        await deleteBranches(repoPath, options.remote);
    });

program.parse(process.argv);
