# GCC 笔记

## 调试

.gdbinit 配置如下

```
set history filename ~/.gdb_history
set history save on

set print address on
set print object on
set print array on
set print array-indexes on
set print symbol on
set print pretty on

set auto-load safe-path /

# https://sourceware.org/gdb/wiki/STLSupport
python
import sys
sys.path.insert(0, '{gcc_root}/libstdc++-v3/python')
from libstdcxx.v6.printers import register_libstdcxx_printers
register_libstdcxx_printers (None)
end
```

- 调试方式1：`gcc hello.c -wrapper gdb,--args`
- 调试方式2：
  1. `gcc hello.c -v` 找到cc1的命令，因为gcc是一个wrapper，实际调用cc1进行编译。当然前提是编译GCC时使用`-O0 -g3`编译的。
  2. `gdb --args /path/to/cc1 -quiet -v hello.c -quiet -dumpbase hello.c -mtune=generic -march=x86-64 -auxbase hello -version -o /tmp/ccJgWTK3.s` 调试cc1

### Bootstrap

```
   old gcc ----> stage1 gcc ----> stage2 gcc
     |
     |
     v
stage1 gcc ----> stage2 gcc ----> stage3 gcc
```

证明stage1 gcc和stage2 gcc两个同样gcc代码编译出来的gcc是否完全等价，也其实就是在证明old gcc和stage1 gcc编译出来的程序执行结果是否等价（新老版本的gcc代码功能上是等价的）。为了证明stage1 gcc和stage2 gcc是否完全等价，可以通过让他们编译一个程序，然后比较他们的程序的二进制是否完全一样。这里选择的程序是gcc自己。用stage1 gcc编译出来的gcc叫stage2 gcc，用stage2 gcc编译出来的gcc叫stage3 gcc。

### 打印

一般来说，GCC会给常见的数据结构增加debug(data)方法用于打印其内容，所以尽可能优先尝试`call debug(data)`命令。

- print-tree.h, gimple-pretty-print.h, print-rtl.h

  ```
  # tree
  call debug_tree(decl) # 打印tree的信息

  # gimple*
  call print_gimple_stmt(stderr, stmt, 0, 0)
  call print_generic_expr(stderr, from, 0)
  
  # gimple_seq
  call print_gimple_seq(stderr, stmts, 0, 0)
  
  # basic_block
  call gimple_dump_bb(stderr, bb, 0, 0)
  
  # function
  call dump_function_to_file(cfun->decl, stderr, TDF_DETAILS)
  # 还有TDF_DETAILS，TDF_LINENO等flags可以添加
  
  # basic block
  call debug (BASIC_BLOCK_FOR_FN (cfun, 1))

  # 打印函数
  p function_name(cfun->decl->function_decl.f)
  b xxx if $_streq(function_name(cfun->decl->function_decl.f), "main")
  
  # 打印data-flow信息
  call df_dump(stderr)

  # rtx
  # 打印单个rtx
  call debug (rtx)
  # 打印rtx列表
  # get_insns() 获取当前的rtx list
  call print_rtl(stderr, get_insns())
  
  # insn 结构
  struct rtx_insn {
    rtx_code code;
    union {
      int insn_uid;
    } u2;
  }
  
  ## rtl-ssa
  pretty_printer pp;
  pp.buffer->stream = stderr;
  crtl->ssa->print(&pp);
  pp_flush(&pp);
  ```


## match.pd笔记

> [gccint对应章节](https://gcc.gnu.org/onlinedocs/gccint/Match-and-Simplify.html)

作用：匹配一段gimple，当其满足指定条件时，转换成另外一段gimple。

示例：

```txt
2078  /* X + Y < Y is the same as X < 0 when there is no overflow.  */
2079  (for op (lt le gt ge)
2080   (simplify
2081    (op:c (plus:c@2 @0 @1) @1)
2082    (if (ANY_INTEGRAL_TYPE_P (TREE_TYPE (@0))
2083         && TYPE_OVERFLOW_UNDEFINED (TREE_TYPE (@0))
2084         && !TYPE_OVERFLOW_SANITIZED (TREE_TYPE (@0))
2085         && (CONSTANT_CLASS_P (@0) || single_use (@2)))
2086     (op @0 { build_zero_cst (TREE_TYPE (@0)); }))))
```

- 待匹配的gimple：`(op:c (plus:c@2 @0 @1) @1)`
- 指定条件：
	```
		(ANY_INTEGRAL_TYPE_P (TREE_TYPE (@0))
		 && TYPE_OVERFLOW_UNDEFINED (TREE_TYPE (@0))
		 && !TYPE_OVERFLOW_SANITIZED (TREE_TYPE (@0))
		 && (CONSTANT_CLASS_P (@0) || single_use (@2))
	```
- 新的gimple：`(op @0 { build_zero_cst (TREE_TYPE (@0)); })`

注：`plus:c@2` 表示op表达式的第一个操作数是一个plus表达式，其值绑定到@2（方便后面引用）

### 如何调试match.pd中的内容

1. 在build目录的gimple-match.cc中，搜索2086，也就是上面示例中的最后一行所在的行号，就可找到以下生成的内容。可以看到if中的条件被copy过去了。
2. 给gimple_simplify_403打上断点。如果进来了则进行逐步调试，如果没有进来说明前面的条件都没有满足，进入步骤3。
3. 搜索gimple_simplify_403被调用的地方，根据调试的gimple代码在合适的位置打上断点。这一步需要你熟悉`(op:c (plus:c@2 @0 @1) @1)`这一段的含义。这一段的时候是说首先找到op表达式（即`lt, le, gt, ge`）然后判断其参数个数位2个，其第一个参数的定义是一个plus表达式，包含两个参数。如果参数个数不对，判断不通过。如果plus的第二个参数@1和op的第二个参数@1不等，判断也是不通过，不会调用gimple_simplify_403。

```c
static bool
gimple_simplify_403 (gimple_match_op *res_op, gimple_seq *seq,
                 tree (*valueize)(tree) ATTRIBUTE_UNUSED,
                 const tree ARG_UNUSED (type), tree *ARG_UNUSED (captures)
, const enum tree_code ARG_UNUSED (op))
{
/* #line 2082 "/path/to/gcc-root/gcc/match.pd" */
  if (ANY_INTEGRAL_TYPE_P (TREE_TYPE (captures[1]))
 && TYPE_OVERFLOW_UNDEFINED (TREE_TYPE (captures[1]))
 && !TYPE_OVERFLOW_SANITIZED (TREE_TYPE (captures[1]))
 && (CONSTANT_CLASS_P (captures[1]) || single_use (captures[0]))
)
    {
      gimple_seq *lseq = seq;
      if (__builtin_expect (!dbg_cnt (match), 0)) goto next_after_fail1354;
      if (__builtin_expect (dump_file && (dump_flags & TDF_FOLDING), 0)) fprintf (dump_file, "Applying pattern %s:%d, %s:%d\n", "match.pd", 2086, __FILE__, __LINE__);
      {
	res_op->set_op (op, type, 2);
	res_op->ops[0] = captures[1];
	res_op->ops[1] =  build_zero_cst (TREE_TYPE (captures[1]));
	res_op->resimplify (lseq, valueize);
	return true;
      }
next_after_fail1354:;
    }
  return false;
}
```

## 支持stride load/store步骤(如下添加internal function）

### Sample Codes

```c
// riscv64-rivai-elf-gcc -O3 -fno-builtin stride.c -S -fdump-tree-ifcvt-details -fdump-tree-vect-details
#include <stdlib.h>

void foo(int *restrict in, int *restrict out, size_t stride) {
  for (size_t i = 0; i < 16; i++) {
    out[i] = in[i * stride];
  }
}
```

### 主要实现代码

```c++
/* gcc/optabs.def */
/* The entries in optabs.def are categorized:
     C: A "conversion" optab, which uses two modes; has libcall data.
     N: A "normal" optab, which uses one mode; has libcall data.
     D: A "direct" optab, which uses one mode; does not have libcall data.
     V: An "oVerflow" optab.  Like N, but does not record its code in
        code_to_optab.

     CX, NX, VX: An extra pattern entry for a conversion or normal optab.

   These patterns may be present in the MD file with names that contain
   the mode(s) used and the name of the operation.  This array contains
   a list of optabs that need to be initialized.  Within each name,
   $a and $b are used to match a short mode name (the part of the mode
   name not including `mode' and converted to lower-case).

   $I means that only full integer modes should be considered for the
   next mode, and $F means that only float modes should be considered.
   $P means that both full and partial integer modes should be considered.
   $Q means that only fixed-point modes should be considered.

   The pattern may be NULL if the optab exists only for the libcalls
   that we plan to attach to it, and there are no named patterns in
   the md files.  */
// 定义RTL IR中的名字，将上面的.LEN_STRIDE_LOAD展开为.md中对应的len_stride_load_<mode>
OPTAB_D (len_stride_load_optab, "len_stride_load_$a")
OPTAB_CD (len_maskload_optab, "len_maskload$a$b")

/* gcc/internal-fn.def */
// #define DEF_INTERNAL_OPTAB_FN(CODE, FLAGS, OPTAB, TYPE)
// 定义Gimple IR中的函数，名字为.LEN_STRIDE_LOAD，第三个参数OPTAB_optab会对应到上面定义的RTL IR名字
DEF_INTERNAL_OPTAB_FN (LEN_STRIDE_LOAD, ECF_PURE, len_stride_load, len_stride_load)

/* gcc/internal-fn.h */
/* Describes an internal function that maps directly to an optab.  */
struct direct_internal_fn_info
{
  /* optabs can be parameterized by one or two modes.  These fields describe
     how to select those modes from the types of the return value and
     arguments.  A value of -1 says that the mode is determined by the
     return type while a value N >= 0 says that the mode is determined by
     the type of argument N.  A value of -2 says that this internal
     function isn't directly mapped to an optab.  */
  signed int type0 : 8; // 第一个参数
  signed int type1 : 8; // 第二个参数，如果是len_stride_load_$a，则只会使用type0
  /* True if the function is pointwise, so that it can be vectorized by
     converting the return type and all argument types to vectors of the
     same number of elements.  E.g. we can vectorize an IFN_SQRT on
     floats as an IFN_SQRT on vectors of N floats.

     This only needs 1 bit, but occupies the full 16 to ensure a nice
     layout.  */
  unsigned int vectorizable : 16;
};

/* gcc/internal-fn.cc */
/*
const direct_internal_fn_info direct_internal_fn_array[IFN_LAST + 1] = {
#define DEF_INTERNAL_FN(CODE, FLAGS, FNSPEC) not_direct,
#define DEF_INTERNAL_OPTAB_FN(CODE, FLAGS, OPTAB, TYPE) TYPE##_direct,
#define DEF_INTERNAL_SIGNED_OPTAB_FN(CODE, FLAGS, SELECTOR, SIGNED_OPTAB, \
				     UNSIGNED_OPTAB, TYPE) TYPE##_direct,
#define DEF_INTERNAL_SIGNED_CONVERT_OPTAB_FN(CODE, FLAGS, SELECTOR1, SELECTOR2, SIGNED_OPTAB, \
				     UNSIGNED_OPTAB, TYPE) TYPE##_direct,
#include "internal-fn.def"
  not_direct
};
*/
#define len_stride_load_direct { -1, -1, false }
#define len_mask_load_direct { -1, 2, false }

/*
#define DEF_INTERNAL_OPTAB_FN(CODE, FLAGS, OPTAB, TYPE) \
  static void						\
  expand_##CODE (internal_fn fn, gcall *stmt)		\
  {							\
    expand_##TYPE##_optab_fn (fn, stmt, OPTAB##_optab);	\
  }
#define DEF_INTERNAL_SIGNED_OPTAB_FN(CODE, FLAGS, SELECTOR, SIGNED_OPTAB, \
				     UNSIGNED_OPTAB, TYPE)		\
  static void								\
  expand_##CODE (internal_fn fn, gcall *stmt)				\
  {									\
    tree_pair types = direct_internal_fn_types (fn, stmt);		\
    optab which_optab = direct_internal_fn_optab (fn, types);		\
    expand_##TYPE##_optab_fn (fn, stmt, which_optab);			\
  }
#define DEF_INTERNAL_SIGNED_CONVERT_OPTAB_FN(CODE, FLAGS, SELECTOR1, SELECTOR2, SIGNED_OPTAB, \
				     UNSIGNED_OPTAB, TYPE)		\
  static void								\
  expand_##CODE (internal_fn fn, gcall *stmt)				\
  {									\
    tree_pair types = direct_internal_fn_types (fn, stmt);		\
    optab which_optab = direct_internal_fn_optab (fn, types);		\
    expand_##TYPE##_optab_fn (fn, stmt, which_optab);			\
  }
#include "internal-fn.def"
*/
#define expand_len_stride_load_optab_fn expand_partial_load_optab_fn

/*
bool
direct_internal_fn_supported_p (internal_fn fn, tree_pair types,
				optimization_type opt_type)
{
  switch (fn)
    {
#define DEF_INTERNAL_FN(CODE, FLAGS, FNSPEC) \
    case IFN_##CODE: break;
#define DEF_INTERNAL_OPTAB_FN(CODE, FLAGS, OPTAB, TYPE) \
    case IFN_##CODE: \
      return direct_##TYPE##_optab_supported_p (OPTAB##_optab, types, \
						opt_type);
#define DEF_INTERNAL_SIGNED_OPTAB_FN(CODE, FLAGS, SELECTOR, SIGNED_OPTAB, \
				     UNSIGNED_OPTAB, TYPE)		\
    case IFN_##CODE:							\
      {									\
	optab which_optab = (TYPE_UNSIGNED (types.SELECTOR)		\
			     ? UNSIGNED_OPTAB ## _optab			\
			     : SIGNED_OPTAB ## _optab);			\
	return direct_##TYPE##_optab_supported_p (which_optab, types,	\
						  opt_type);		\
      }
#define DEF_INTERNAL_SIGNED_CONVERT_OPTAB_FN(CODE, FLAGS, SELECTOR1, SELECTOR2, SIGNED_OPTAB, \
				     UNSIGNED_OPTAB, TYPE)		\
    case IFN_##CODE:							\
      {									\
	optab which_optab = (TYPE_UNSIGNED (types.SELECTOR1)		\
			     ? UNSIGNED_OPTAB ## _optab			\
			     : SIGNED_OPTAB ## _optab);			\
	return convert_optab_handler (which_optab, TYPE_MODE (types.SELECTOR1),	TYPE_MODE (types.SELECTOR2));		\
      }
#include "internal-fn.def"

    case IFN_LAST:
      break;
    }
  gcc_unreachable ();
}
*/
#define direct_len_stride_load_optab_supported_p direct_optab_supported_p
```

## 添加TARGET HOOKS

1. 修改如下文件添加新target hook
```
/* targhooks.h */
+extern rtx default_forward_src (rtx, rtx, rtx)

/* targhooks.cc */
+/* The default implementation of TARGET_FORWARD_SRC */
+rtx
+default_forward_src (rtx dest, rtx src, rtx_insn *dest_insn)
+{
+  return src;
+}

/* target.def */
+DEFHOOK
+(forward_src,
+ "Returns the real src to forward. Use for UNSPEC insn, for STANDARD operator,\n\
+you should return src.",
+ rtx, (rtx dest, rtx src, rtx_insn *dest_insn), default_forward_src)

/* tm.texi.in */
+@hook TARGET_FORWARD_SRC
```
2. 构建，会报如下错误，提醒你将新生成的tm.texi复制到源代码中去
```
Verify that you have permission to grant a GFDL license for all
new text in /path/to/gcc/build-gcc-elf-rv64/build-gcc-newlib-stage2/gcc/tm.texi, then copy it to /path/to/gcc/doc/tm.texi.
```
3. 再次构建

## GCC passes

[./passes.md](./passes.md)

## GCC options

[./options.md](./options.md)

## GCC开发的坑

- 头文件的改动，不会触发引用到该头文件的c文件重新编译，会导致代码不更新。解决方法是手动改下每个include该头文件的c文件或者重新完整编译。
- error: unrecognizable insn 错误
  - 可能是因为没有找到合适的pattern，一般是在vregs pass中出错
    - 自定义的pattern的寻找是通过mode和unspec进行的，如果某个指定了mode的参数的predicate支持(const_int 0)，则有可能在GET_MODE的时候返回VOID mode，进而无法匹配到pattern
  - 可能是constraint没有匹配的，虽然predicate过了。一般在reload pass中出错

## GCC test

- AArch64
  - 准备dejagnu
    - `git clone git://git.savannah.gnu.org/dejagnu.git`
    - modify /path/to/dejagnu/baseboards/aarch64-sim.exp
      ```diff
      -set_board_info ldflags "[libgloss_link_flags] [newlib_link_flags] -specs=rdimon.specs"
      +set_board_info ldflags "[libgloss_link_flags] [newlib_link_flags] -static"
      ```
  - 准备qemu
    - `git clone https://gitlab.com/qemu-project/qemu.git`
    - `mkdir build && cd build && ../configure --target-list=aarch64-linux-user --prefix=/path/to/install`
    - `make -j && make install -j`
  - 运行gcc测试
    - add bellow code to site.exp
      ```
      if ![info exists boards_dir] {
        set boards_dir {}
      }
      lappend boards_dir /path/to/dejagnu/baseboards
      set SIM "/path/to/install/bin/qemu-aarch64 -L /path/to/build-gcc/sysroot"
      ```
    - 快速验证：`make check-c -j1 RUNTESTFLAGS="--target_board=aarch64-sim aarch64.exp=abd_run_1.c"`
    - `make check RUNTESTFLAGS="--target_board=aarch64-sim" -j`



## GCC提交patch到upstream

- 申请write after approval权限
- 同步至最新代码：
  - `git remote add upstream git://gcc.gnu.org/git/gcc.git` 和 `git remote add github https://github.com/gcc-mirror/gcc.git`
  - 设置同步源并拉去代码。如果你访问git://gcc.gnu.org/git/gcc.git源的速度很快，则可以忽略本步骤。直接使用下一步中的源同步代码。
  - 这两个git源那个快用哪个，我一般先用github源同步到最新（`git pull github trunk --rebase --verbose`）然后在用upstream同步github源上确实的（`git pull upstream trunk --rebase --verbose`）。github源速度会快些，但是因为有同步频率问题（不是实时），有些非常新的commit只有upstream源上面有，所以两个都要。
- `git remote set-url lhtin git+ssh://lhtin@gcc.gnu.org/git/gcc.git` 增加提及代码的git源，其中lhtin改为你申请权限时设置的名字
- `git am /path/to/your/patch` 将你的代码commit
- **完整测试（这一步很重要，因为有可能在你提交patch让别人review到patch被接受之间有其他人提交新代码过来，除非你确保这段时间没有相关的改动）**
- `git push lhtin` 提交代码
- 推荐使用[Thunderbird](https://www.thunderbird.net/)邮箱客户端
  - 纯文本邮箱客户端推荐：https://useplaintext.email
  - 如果使用git-send-email：https://git-send-email.io/

## 开发智慧

- 修改已有的prxxx.c测试用例时，要看清楚该用例的用途，可以通过查看当时的bugzilla单了解
  - 类似这个patch修复的内容，我之前提交的一个patch只是简单的增加了一个error，但实际上这个testcase是想要测试两个字母的extension不会报错，改了之后没有达到测试的目的：https://gcc.gnu.org/pipermail/gcc-patches/2023-August/627122.html
