# Shell笔记

- Shell脚本里建议设置的开关
  - `set -e` 当有命令执行失败时立即退出
  - `set -o pipefail` 当pipe命令中有一个命令失败则整个pipe当作失败对待
  - `set -u` 对未定义的变量进行报错
  - `set -x` 打印执行的每一条命令

# Commands

- `cd`
  - `cd -` 回到前一个访问的目录
  - `cd ~` 进入home目录
- `command 2>&1 | tee xxx.log` 将command的stdout和stderr输出到屏幕，同时保存到xxx.log文件中
- `> xxx.log && command 2>&1 >> xxx.log | tee -a xxx.log` 目的是报错stderr和stdout的内容到xxx.log，同时只在屏幕输出stderr的内容
  1. `> xxx.log` 表示清空xxx.log文件
  2. `command 2>&1 >> xxx.log` 表示将command的stdout输出追加到xxx.log文件，并且将stderr重定向到stdout
  3. `| tee -a xxx.log` 表示将前面命令的stdout，其实这是就是stderr重定向过来的内容追加到xxx.log并继续输出到stdout
- `less` 按Shift+F等待新写入的内容，按Ctrl+C取消等待
- decompress:
  - `.deb`: `ar -vx xxx.deb` 里面会有data.tar.zst文件，使用下面的方式解压
  - `.tar.zst`: 'zstd -d xxx.tar.zst && tar -xf xxx.tar`
- `ldd` 查看程序所以来的动态库
- `lsof +D /path/to/dir` 查看文件占用情况
- rsync拷贝文件，可以跨服务器
  - `rsync --progress SRC [SRC]... DEST`
  - `rsync --progress [USER@]HOST:SRC [DEST]`
