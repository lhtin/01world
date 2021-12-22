# Make Note

## Debug Makefile

> 来源：https://www.oreilly.com/openbook/make3/book/ch12.pdf

- `$(warning xxx)` 放置在Target前面，运行的时候会打印出来
- `--just-print` 打印target所会执行到的target，但不执行
- `--print-data-base` 执行的每一个target并打印丰富的信息
  - 有一个GNU Binutils中gas Makefile重复运行install-info-am两次的问题（在并发下面有可能会导致报错）通过这种方式找到了原因
