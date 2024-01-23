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
- rsync 同步文件，可以跨服务器（参考：https://www.ruanyifeng.com/blog/2020/08/rsync.html）
  - `rsync -r -l --progress SRC [SRC]... DEST`
    - `-r` 表示目录
    - `-l` 表示也复制软连接
  - `rsync -r -l --progress [USER@]HOST:SRC DEST`
- 获取程序运行最大内存：
  ```
  # --pages-as-heap=yes 表示统计整个程序的内存占用，包括堆、栈、elf中的数据段和代码段等load段所占用的内存。也就是这个程序申请的page数量
  valgrind --tool=massif --pages-as-heap=yes --massif-out-file=massif.out prop [args]
  # 输出mem_heap_B最大值
  grep mem_heap_B massif.out | sed -e 's/mem_heap_B=\(.*\)/\1/' | sort -g | tail -n 1
  ```
  注意查看GCC中的编译器内存消耗时，因为gcc是一个壳，它会调用cc1/cc1plus/f951等程序去编译，我们需要直接找到cc1命令来统计内存占用。
  例如：`valgrind --tool=massif --pages-as-heap=yes --massif-out-file=massif.out /install/libexec/gcc/riscv64-unknown-linux-gnu/14.0.1/cc1 -quiet -v -imultilib . hello.c -quiet -dumpdir a- -dumpbase hello.c -dumpbase-ext .c -mtune=rocket -march=rv64imafdcv_zicsr_zifencei_zve32f_zve32x_zve64d_zve64f_zve64x_zvl128b_zvl32b_zvl64b -mabi=lp64d -misa-spec=20191213 -march=rv64imafdcv_zicsr_zifencei_zve32f_zve32x_zve64d_zve64f_zve64x_zvl128b_zvl32b_zvl64b -O3 -version -o /tmp/ccPfT8KL.s`
- 将diff和patch转成更容易看的html网页：`diff2html --input file --style side --file a.html --  a.diff`
  - 安装：`npm install diff2html-cli`
  - 官网：https://diff2html.xyz/
- 非root权限安装yum包
  - 下载yum包：`yumdownloader package`
  - 解压（文件放在当前目录的usr目录下面）：`rpm2cpio package | cpio -idmv`
