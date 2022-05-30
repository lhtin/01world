# GDB

> homepage: https://www.gnu.org/software/gdb/
> 
> docs: https://sourceware.org/gdb/download/onlinedocs/

- `.gdbinit` GDB配置文件
- `gdb <executable-file> <core-file>` 使用gdb查看运行程序发生core dumped之后的文件定位问题。有条件<executable-file>最好使用-g编译携带调试信息。
  
## QEMU with GDB


- `qemu-riscv32 -g 2345 -B 0x10000 ./a.out`
- `gdb ./a.out` or `gdb --args ./a.out`
  
  进入gdb交互之后输入`target remote localhost:2345`连上gdb-server。
  
