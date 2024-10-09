# Sync Server

## 流程 
流程：
1、获取外部数据库的binlog状态 `show master status`
2、将外部数据库的binlog下载到本地
3、将外部数据库的binlog上传到内部数据库的服务器 (scp命令)
4、通过`ssh && mysqlbinlog` 在目标机器上执行命令

## prepare
需要在本地的windows上设置linux服务器（也就是mysql的那台服务器）免登录，否则ssh命令需要输入密码颇为麻烦
简便的设置免登录的方法
1、windows上生成公密钥(如果没有的话)
```
ssh-keygen
```
2、打开git bash
```
ssh-copy-id -i ~/.ssh/id_rsa.pub -p 22 username@host
```
3、直接ssh -P 22 username@host查看是否能免登录

## env
// inner database
DATABASE_URL=mysql://root:root@@127.0.0.1:3307/test_for_sync
// download outer database binlog
DOWNLOAD_BINLOG_URL=http://localhost:5555
// downloaded file dir
DOWNLOAD_FILE_DIR=/Users/ruleeeer/docker-data/download_binlog
// scp to mysql host dir
SCP_TARGET_DIR=/data2/binlog
// mysql`s server ssh info
SSH_HOST=127.0.0.1
SSH_USERNAME=root
SSH_PORT=22