# GCC 笔记

## GCC options

[./options.md](./options.md)

## 调试

### 打印

- gimple-pretty-print.h
- print-rtl.h, rtl.h, print-tree.h
- gdb
  ```
  call gimple_dump_bb(stderr, bb, 0, 0)
  call print_gimple_seq(stderr, stmts, 0, 0)
  call print_gimple_stmt(stderr, stmt, 0, 0)
  call print_generic_expr(stderr, from, 0)
  call print_rtl_single(stderr, last)
  call print_rtl(stderr, get_insns())
  p gimple_code(stmt)
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
