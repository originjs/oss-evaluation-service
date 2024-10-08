import { createWriteStream, existsSync, mkdirSync } from 'fs';
import logger from '../logger/pino-logger.js';
import { SyncDatabaseRecord } from '../model/SyncDatabaseRecord.js';
import shelljs from 'shelljs';
import { Result } from '@orginjs/oss-evaluation-util';
import { Readable } from 'stream';
import { dirname } from 'path';
import { ProxyAgent } from 'undici';

export async function executeDatabaseSync(): Promise<Result<void>> {
  // get binlog status
  const positionAndFileInfo = await prepareSync();
  const fileList = buildBinlogFileList(positionAndFileInfo);
  const syncRecord = await createSyncRecord(positionAndFileInfo);
  try {
    // download all binlog files
    await downloadAllBinlogFiles(fileList, syncRecord);
    // run mysqlbinlog command
    runMySQLBinlog(fileList, syncRecord);
    syncRecord.set('success', true);
  } catch (e) {
    logger.error(e);
    syncRecord.set({
      msg: `${syncRecord.dataValues.msg} ${e.stack.substring(0, Math.min(e.stack.length, 1000))}`,
    });
  }
  syncRecord.set('endTime', new Date());
  await syncRecord.save();
  return syncRecord.dataValues.success
    ? Result.ok(null, syncRecord.msg)
    : Result.fail(syncRecord.dataValues.msg);
}

async function createSyncRecord(positionAndFile: {
  startFilename: string;
  startPosition: number;
  stopFilename: string;
  stopPosition: number;
}) {
  const record = SyncDatabaseRecord.build({
    startFilename: positionAndFile.startFilename,
    startPosition: positionAndFile.startPosition,
    endFilename: positionAndFile.stopFilename,
    endPosition: positionAndFile.stopPosition,
    success: false,
    startTime: new Date(),
    // avoid much msg??'' operation
    msg: '',
  });
  await record.save();
  record.dataValues.id = record.id;
  return record;
}

type syncParam = {
  filename: string;
  startPosition?: number;
  stopPosition?: number;
};

function buildBinlogFileList(positionAndFileInfo: {
  startFilename: string;
  startPosition: number;
  stopFilename: string;
  stopPosition: number;
}): syncParam[] {
  const { startFilename, startPosition, stopFilename, stopPosition } = positionAndFileInfo;
  const res: syncParam[] = [];
  const startIndex = getIndexOfBinlogFile(startFilename);
  const endIndex = getIndexOfBinlogFile(stopFilename);
  if (startIndex > endIndex) {
    throw new Error(
      `[syncDatabaseService] binlog file number err , startIndex:${startIndex} endIndex:${endIndex}`,
    );
  }
  for (let i = startIndex; i <= endIndex; i++) {
    res.push({
      filename: `binlog.${i.toString().padStart(6, '0')}`,
    });
  }
  res[0].startPosition = startPosition;
  res[res.length - 1].stopPosition = stopPosition;
  if (res[0].startPosition === res[0].stopPosition) {
    throw new Error(`[syncDatabaseService] startPosition and stopPosition are the same, stop sync`);
  }
  return res;
}

function getIndexOfBinlogFile(filename: string) {
  const regex = /(?<=\.)\d+$/;
  return parseInt(filename.match(regex)[0]);
}

async function prepareSync() {
  const record = await getLastSyncRecord();
  if (!record?.success || !record.endFilename || !record.endPosition) {
    const errMsg = `[syncDatabaseService] last record :${JSON.stringify(record)} is not success or has no stop info,stopping sync`;
    logger.error(errMsg);
    throw new Error(errMsg);
  }
  // start position and filename
  const { endFilename: startFilename, endPosition: startPosition } = record;
  // stop position and filename
  const { position: stopPosition, filename: stopFilename } = await getBinlogStatus();
  return { startFilename, startPosition, stopFilename, stopPosition };
}

async function getLastSyncRecord() {
  return await SyncDatabaseRecord.findOne({
    order: [['id', 'DESC']],
    limit: 1,
    raw: true,
  });
}

async function downloadFile(url: string, filePath: string) {
  const proxyUrl = process.env.PROXY_URL;
  const response = await fetch(
    url,
    // @ts-expect-error no need handle
    proxyUrl ? { dispatcher: new ProxyAgent(process.env.PROXY_URL) } : undefined,
  );
  if (!response.ok) {
    throw new Error(`download file failed, status code: ${response.status} , url:${url}`);
  }
  const dir = dirname(filePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  const fileStream = createWriteStream(filePath);
  Readable.fromWeb(response.body as any).pipe(fileStream);
  return new Promise((resolve, reject) => {
    fileStream.on('finish', resolve);
    fileStream.on('error', reject);
  });
}

async function downloadAllBinlogFiles(fileList: syncParam[], syncRecord: SyncDatabaseRecord) {
  const downloadFileDir = getDownloadFileDir(syncRecord);
  for (const syncParam of fileList) {
    await downloadFile(
      `${process.env.DOWNLOAD_BINLOG_URL}/download/downloadFile?filename=${syncParam.filename}`,
      `${downloadFileDir}/${syncParam.filename}`,
    );
    syncRecord.set('msg', `${syncRecord.dataValues.msg} download ${syncParam.filename} success;\n`);
  }
}

function runMySQLBinlog(fileList: syncParam[], syncRecord: SyncDatabaseRecord) {
  const downloadFileDir = getDownloadFileDir(syncRecord);
  const commandPath = shelljs.which('mysqlbinlog')?.stdout;
  if (!commandPath) {
    throw new Error(`mysqlbinlog not found`);
  }
  const mysqlInfo = getTargetMySQLInfo();
  for (const syncParam of fileList) {
    const binlogCommand = `${commandPath} ${downloadFileDir}/${syncParam.filename} \
      ${syncParam.startPosition ? `--start-position=${syncParam.startPosition}` : ''} \
      ${syncParam.stopPosition ? `--stop-position=${syncParam.stopPosition}` : ''}\
      | mysql -u${mysqlInfo.username} -p${mysqlInfo.password} -h${mysqlInfo.host} -P${mysqlInfo.port}`;
    const result = shelljs.exec(binlogCommand);
    if (result.code !== 0) {
      throw new Error(`run mysqlbinlog:{${binlogCommand}} failed, err:${result.stderr}`);
    }
    syncRecord.set('msg', `${syncRecord.dataValues.msg} run command:{${binlogCommand}} success\n`);
  }
}

function getDownloadFileDir(syncRecord: SyncDatabaseRecord) {
  return `${process.env.DOWNLOAD_FILE_DIR}/${syncRecord.dataValues.id}`;
}

function getTargetMySQLInfo() {
  const databaseUrl = process.env.INNER_DATABASE_URL.replace('mysql', 'http');
  const url = new URL(databaseUrl);
  return {
    host: url.hostname,
    port: url.port,
    username: url.username,
    password: decodeURIComponent(url.password),
  };
}

async function getBinlogStatus(): Promise<{ position: number; filename: string }> {
  const proxyUrl = process.env.PROXY_URL;
  const getStatusUrl = `${process.env.DOWNLOAD_BINLOG_URL}/download/binlog-status`;
  const response = await fetch(
    getStatusUrl,
    // @ts-expect-error no need handle
    proxyUrl ? { dispatcher: new ProxyAgent(process.env.PROXY_URL) } : undefined,
  );
  if (!response.ok) {
    throw new Error(
      `get binlog status failed, status code: ${response.status} , url:${getStatusUrl}`,
    );
  }
  return await response.json();
}
