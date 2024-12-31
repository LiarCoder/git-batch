const { execSync } = require('child_process');
const { promptUser } = require('../utils/prompt');

function getBranches(repoPath, remoteOnly) {
    const command = remoteOnly ? 'git branch -r' : 'git branch';
    const branches = execSync(command, { cwd: repoPath }).toString().split('\n').map(branch => branch.trim()).filter(branch => branch);
    return branches;
}

async function deleteBranches(repoPath, remoteOnly) {
    const branches = getBranches(repoPath, remoteOnly);
    const selectedBranches = await promptUser(branches);
        
    if (selectedBranches.length === 0) {
        console.log('没有选择任何分支。');
        return;
    }

    console.log('您选择删除以下分支:');
    selectedBranches.forEach(branch => console.log(`- ${branch}`));

    const confirmation = await promptUser(['确认删除', '取消']);
    
    if (confirmation.includes('确认删除')) {
        for (const branch of selectedBranches) {
            const remoteBranch = branch.replace('* ', '').trim();
            if (remoteOnly) {
                try {
                    execSync(`git push origin --delete ${remoteBranch}`, { cwd: repoPath });
                    console.log(`成功删除远程分支: ${remoteBranch}`);
                } catch (error) {
                    console.error(`删除远程分支 ${remoteBranch} 失败: ${error.message}`);
                }
            } else {
                try {
                    execSync(`git branch -d ${branch}`, { cwd: repoPath });
                    console.log(`成功删除本地分支: ${branch}`);
                    
                    const deleteRemote = await promptUser(['删除远程分支', '保留远程分支']);
                    if (deleteRemote.includes('删除远程分支')) {
                        try {
                            execSync(`git push origin --delete ${remoteBranch}`, { cwd: repoPath });
                            console.log(`成功删除远程分支: ${remoteBranch}`);
                        } catch (error) {
                            console.error(`删除远程分支 ${remoteBranch} 失败: ${error.message}`);
                        }
                    }
                } catch (error) {
                    console.error(`删除分支 ${branch} 失败: ${error.message}`);
                }
            }
        }
    } else {
        console.log('删除操作已取消。');
    }
}

module.exports = { deleteBranches };