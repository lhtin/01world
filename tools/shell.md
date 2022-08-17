# Shell笔记

- Shell脚本里建议设置的开关
  - `set -e` 当有命令执行失败时立即退出
  - `set -o pipefail` 当pipe命令中有一个命令失败则整个pipe当作失败对待
  - `set -u` 对未定义的变量进行报错
  - `set -x` 打印执行的每一条命令
