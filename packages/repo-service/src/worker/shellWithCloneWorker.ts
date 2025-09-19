import { parentPort } from 'worker_threads';
import shelljs from 'shelljs';
import { Result } from '../utils/result.js';
import { logger } from '@orginjs/oss-evaluation-data-model';
import { cloneRepoIfNotExist } from '../utils/git/gitClone.js';

interface ShellWithCloneParam {
    // Git clone参数
    owner: string;
    repoName: string;
    platformType?: number;
    pullIfExists?: boolean;
    shadowClone?: boolean;
    // Shell命令参数
    command: string;
    cleanupAfter?: boolean; // 是否在执行完shell命令后清理
}

async function execCommandWithClone(param: ShellWithCloneParam): Promise<Result<string>> {
    const cloneParam = {
        owner: param.owner,
        repoName: param.repoName,
        platformType: param.platformType,
        pullIfExists: param.pullIfExists || false,
        shadowClone: param.shadowClone || true,
    };

    try {
        // 1. 先clone代码
        logger.info(`${param.owner}/${param.repoName}: Starting git clone for shell command`);
        const cloneResult = await cloneRepoIfNotExist(cloneParam);
        if (!cloneResult.ok) {
            throw new Error(`Git clone failed: ${cloneResult.msg}`);
        }

        // 2. 执行shell命令
        logger.info(`${param.owner}/${param.repoName}: Executing shell command:{\n  ${param.command}\n  }`);
        const commandResult = execCommand(param.command);

        return commandResult;
    } catch (error) {
        logger.error(`${param.owner}/${param.repoName}: Shell command with clone failed:`, error);
        throw error;
    } finally {
        // 3. 如果需要清理，执行清理
        if (param.cleanupAfter) {
            const cleanupCommand = `rm -rf ${process.env.REPO_DIR}/${param.owner}/${param.repoName}`;
            logger.info(`${param.owner}/${param.repoName}: Executing cleanup:{\n  ${cleanupCommand}\n  }`);
            shelljs.exec(cleanupCommand);
        }
    }
}

function execCommand(command: string): Result<string> {
    if (!command) {
        throw new Error('the command is empty!');
    }
    const commandResult = shelljs.exec(command);
    return commandResult.code === 0
        ? Result.ok(commandResult.stdout)
        : Result.fail(commandResult.stderr);
}

parentPort.on('message', async param => {
    try {
        logger.info(`Shell with clone worker start exec: ${JSON.stringify(param)}`);
        const startTime = new Date();

        let result: Result<string>;

        // 判断是否是新的带clone的参数格式
        if (typeof param === 'object' && param.owner && param.repoName && param.command) {
            result = await execCommandWithClone(param as ShellWithCloneParam);
        } else {
            // 兼容旧的字符串命令格式
            result = execCommand(param as string);
        }

        const endTime = new Date();
        const duration = (endTime.getTime() - startTime.getTime()) / 1000;
        logger.info(`Shell with clone worker end: ${duration}s`);

        parentPort.postMessage(result);
    } catch (e) {
        parentPort.postMessage(Result.fail(e.message));
    }
});
