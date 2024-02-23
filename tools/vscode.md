# VS Code

## 必备插件

- [ctagsx](https://marketplace.visualstudio.com/items?itemName=jtanx.ctagsx)

  根据tags文件跳转到定义的位置，需要提前生成好tags文件（比如gcc的tags生成命令：`ctags --fields=+iaS --extras=+q --exclude="testsuite/*" --exclude="config/*" --exclude-exception="config/riscv/*" --append=no --recurse --totals=yes .`）

- [Clang-Format](https://marketplace.visualstudio.com/items?itemName=xaver.clang-format)

  调用clang-format格式化代码
