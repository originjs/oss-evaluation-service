# download server
用于下载binlog文件的服务器(理论上也可以使用一些ftp、静态服务器替代，但是由于binlog处于写变化状态，所以需要将binlog文件通过shell复制之后下载)

## 流程
1、请求时携带binlog的文件名称
2、将binlog文件名称复制到环境变量配置的文件夹
3、开始下载


## env
// binlog文件所在目录
BINLOG_FILE_DIR=/Users/ruleeeer/docker-data/mysql1_data
// 将binlog复制的目的地
CP_BINLOG_FILE_DIR=/Users/ruleeeer/docker-data/bak
DATABASE_URL=mysql://root:root@127.0.0.1:3306/test_for_sync