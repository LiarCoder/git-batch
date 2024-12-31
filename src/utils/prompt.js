const inquirer = require('inquirer');
function promptUser(branches) {
    return new Promise((resolve) => {
        inquirer.prompt([
            {
                type: 'checkbox',
                name: 'selectedBranches',
                message: '请选择要删除的分支:',
                choices: branches,
            },
            {
                type: 'confirm',
                name: 'confirmDelete',
                message: '您确定要删除选中的分支吗?',
                default: false,
            },
        ]).then(answers => {
            if (answers.confirmDelete) {
                resolve(answers.selectedBranches);
            } else {
                resolve([]);
            }
        });
    });
}

module.exports = { promptUser };