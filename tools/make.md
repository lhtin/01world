# Make Note

## Debug Makefile

> 来源：https://www.oreilly.com/openbook/make3/book/ch12.pdf

- `$(warning xxx)` 放置在Target前面，运行的时候会打印出来
- `--just-print` 打印target所会执行到的target，但不执行
- `--print-data-base` 执行的每一个target并打印丰富的信息
  - 有一个GNU Binutils中gas Makefile重复运行install-info-am两次的问题（在并发下面有可能会导致报错）通过这种方式找到了原因。报错原因是因为`install-data-am: install-data-local install-info-am install-man`中的install-data-local会依赖install-info，而install-info依赖install-info-recursive，而这个target会到当前目录执行`make install-info-am`，与一开始依赖的install-info-am重复。同时这个任务是一个install命令的伪任务，它会先移除dest中的文件，在复制过去，所以并发下面可能会出现冲突。
