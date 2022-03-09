# GCC 笔记

## GCC options

[./options.md](./options.md)

## GCC开发的坑

- 头文件的改动，不会触发引用到该头文件的c文件重新编译，会导致代码不更新。解决方法是手动改下每个该头文件的c文件。
- error: unrecognizable insn 错误，可能是因为没有找到合适的pattern，可能是constraint没有匹配的，虽然predicate过了。一般在reload pass中出错

## 调试

- `gcc hello.c -v` 找到cc1的命令，因为gcc是一个wrapper，实际调用cc1进行编译。当然前提是编译时使用`-O0 -g`编译的。
- `gdb --args /usr/local/libexec/gcc/x86_64-pc-linux-gnu/7.5.0/cc1 -quiet -v hello.c -quiet -dumpbase hello.c -mtune=generic -march=x86-64 -auxbase hello -version -o /tmp/ccJgWTK3.s` 调试cc1

### 打印

- print-tree.h

  ```
  call debug_tree(decl) # 打印tree的信息
  ```

- gimple-pretty-print.h

  ```
  # gimple*
  call print_gimple_stmt(stderr, stmt, 0, 0)
  call print_generic_expr(stderr, from, 0)
  
  # gimple_seq
  call print_gimple_seq(stderr, stmts, 0, 0)
  
  # basic_block
  call gimple_dump_bb(stderr, bb, 0, 0)
  ```

- print-rtl.h

  ```
  # rtx
  # 打印单个rtx
  call print_rtl_single(stderr, last)
  # 打印rtx列表
  # get_insns() 获取当前的rtx list
  call print_rtl(stderr, get_insns())
  ```

## Passes

### cfgexpand.c（gimple -> rtl)

```
pass_expand::execute (function *fun) // 以函数为单位
  expand_gimple_basic_block // 对每个基本块进行展开
  	expand_gimple_tailcall
  	expand_gimple_stmt
  	  expand_call_stmt // 调用展开
  	    expand_internal_call // gcc内部函数调用
```
