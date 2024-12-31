// src/index.js

const { deleteBranches } = require('./commands/deleteBranches');

const main = async () => {
    console.log('欢迎使用 git-batch 工具！');
    await deleteBranches();
};

main().catch(err => {
    console.error('发生错误:', err);
});