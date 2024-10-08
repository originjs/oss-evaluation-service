import { Result } from '@orginjs/oss-evaluation-util';
import { Controller, Route, Query, Get } from 'tsoa';
import shelljs from 'shelljs';
import { existsSync, readFileSync } from 'fs';
import { Readable } from 'stream';
import { unlink } from 'fs/promises';
import logger from '../logger/pino-logger.js';
import { outerSequelize } from '../model/database.js';
import { QueryTypes } from 'sequelize';

@Route('download')
export class RepoController extends Controller {
  @Get('downloadFile')
  public downloadFiles(@Query() filename: string) {
    const fileDir = process.env.BINLOG_FILE_DIR;
    const cpFileDir = process.env.CP_BINLOG_FILE_DIR;
    if (!fileDir || !cpFileDir) {
      return Result.fail('FILE_DIR or CP_FILE_DIR is not set');
    }
    const filePath = `${fileDir}/${filename}`;
    if (!existsSync(filePath)) {
      logger.error(`${filePath} doesnt exist`);
      return Result.fail('file doesnt exist');
    }
    // since the binlog may be in the write state, make a copy and download it
    const cpFilePath = `${cpFileDir}/${filename}_bak_${new Date().getTime()}`;
    const cpResult = shelljs.cp(filePath, cpFilePath);
    if (cpResult.code !== 0) {
      logger.error(`cp file ${filePath} to ${cpFilePath} failed`);
      return Result.fail(`cp file ${filePath} to ${cpFilePath} failed`);
    }
    const stream = Readable.from(this.file2Buffer(cpFilePath, filename));
    // delete the bak file
    unlink(cpFilePath).catch(err => {
      logger.error(`delete ${cpFilePath} failed`, err);
    });
    return stream;
  }

  @Get('binlog-status')
  public async binlogStatus() {
    const [{ Position: position, File: filename }] = (await outerSequelize.query(
      'show master status',
      { type: QueryTypes.SELECT },
    )) as { Position: string; File: string }[];
    return { position: parseInt(position), filename };
  }

  file2Buffer(filePath: string, filename: string) {
    const buffer = Buffer.from(readFileSync(filePath));
    this.setHeader('Content-Disposition', `attachment; filename=${encodeURIComponent(filename)}`);
    this.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    return buffer;
  }
}
