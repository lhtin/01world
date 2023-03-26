# RISC-V函数栈帧及GCC实现

## RISC-V函数栈帧及内存布局

随着程序规模的变大，程序往往会分成多个函数，然后通过函数调用方式运行程序。函数调用涉及传参和接收返回值。因此，需要有一个统一的调用规则，这样在编译某个函数时，不需要知道它是如何被调用的，只需要按照约定从对应的寄存器或者内存地址取出来就可以了。同时在编译函数调用代码时，也不需要知道函数的具体实现，只需要按照调用规则，将参数放到规定的位置然后跳转到被调函数的起始位置，然后在被调函数返回之后从规定的位置获取返回值即可。每个处理器架构都会约定一个调用约定，约定函数参数和返回值存放的位置。根据RISC-V调用约定（[RISC-V Calling Conventions](https://github.com/riscv-non-isa/riscv-elf-psabi-doc/blob/master/riscv-cc.adoc)），当寄存器不够用的时候会将其存储到函数栈帧中（各种类型参数如何传递参见RISC-V调用约定，本文侧重于分析函数栈帧）。包括以下几种情况：

- 当参数需要两个参数寄存器才能传递，但是只有一个可用的参数寄存器时，这时参数一部分通过唯一可用的参数寄存器传递，另一部分通过函数栈帧传递
  
  注：参数寄存器包括整数寄存器（a0-a7）、浮点数寄存器（fa0-fa7）、向量寄存器（v8-v23，还没有正式约定）

- 对于可变参数函数，通过参数寄存器传递的匿名参数会重新存储到函数栈帧中
- 当函数参数过多时也需要将无法通过参数寄存器传参的参数存储到函数栈帧中

除此之外，函数栈帧中还需要包含以下内容：

- 如果函数体使用了callee-saved的寄存器（寄存器不够用导致），需要先将其存储到函数栈帧中，以便在函数返回时将其还原
  
  注：callee-saved寄存器包括整数寄存器（s0-s11）、浮点数寄存器（fs0-fs11）

- 需要保存到内存中的局部变量（寄存器不够用导致）
- 通过调用`__builtin_alloca`分配的栈内存

以上需要在函数栈帧中存储的内容会形成一个栈帧布局，栈帧如何布局目前没有一个统一的规则。为了让不同编译器编译的代码可以互相调用，至少需要统一通过栈传入的参数相对栈的位置和顺序（也就是下图中的outgoing stack arguments区域）。至于其他内容，不同编译器可以有自己的实现，不影响调用方的传参方式。本文给出GCC中实现的函数栈帧布局及其具体实现。其中函数栈帧包含以下内容：

```
high memory address

|===============================|
|                               | 属于函数调用者的outgoing stack arguments区域，
|  incoming stack arguments     | 放在这里便于理解。
|                               | （从下往上分配，padding在上面）
|===============================| <-- caller sp
|                               |
|  callee-allocated save area   | 当参数需要两个寄存器但是只有一个可用时，需要将
|  for argument that are        | 通过寄存器传递的部分（参数中的低位）存入该区域。
|  split between register and   | 从而和存储在incoming stack arguments中的
|  the stack                    | 另一半组成一个整体。简称partial register区域
|                               | （从上往下分配，padding在下面）
|===============================|
|                               |
|  callee-allocated save area   | 匿名参数通过寄存器传递时，需要将其存储到该区域。
|  for register varargs         | 会跟incoming stack arguments区域衔接。简称varargs区域
|                               | （从下往上分配，padding在下面）
|===============================|
|                               |
|  GPR save area                | 用于存储需要存储的callee-saved整数寄存器。
|                               | （从上往下分配，padding在下面）
|===============================|
|                               |
|  FPR save area                | 用于存储需要存储的callee-saved浮点数寄存器。
|                               |
|===============================|
|                               |
|  local variables              | 用于存储局部变量。
|                               |
|===============================|
|                               |
|  dynamic allocation           | 调用__builtin_alloca动态分配的栈内存。
|                               |
|===============================|
|                               |
|  outgoing stack arguments     | 用于存储在调用函数时通过栈传递的参数。
|                               | （从下往上分配，padding在上面）
|===============================| <-- callee sp

low memory address
```

部分区域说明：

- incoming stack arguments

  存储顺序为低地址->高地址

- callee-allocated 两个区域

  这两个区域用于将通过寄存器传递的参数重新存入栈帧。**注意一个栈帧中永远不会同时出现这两个区域。**

  varargs区域的存储顺序为低地址->高地址（但是注意padding部分是放在低地址的，从而使得varargs最后一个值和通过栈传入的第一个参数相邻）

- local variables

  高地址->低地址

- GPR save area

  如果需要保存ra，则其必须放在第一位，如果需要保持s0，则s0必须放在下一次

- dynamic allocation

  该区域并不是一开始就分配的，而是在函数执行过程中动态分配的。

- outgoing stack arguments

  该区域根据函数中调用其他函数的参数类型和个数确定，函数中含有多个调用时取最大值。

  存储顺序为低地址->高地址（padding放在高地址）

- GCC中会对每个区域做对齐（默认16 bytes对齐）

#### 代码示例

C源代码如下（[在线地址](https://godbolt.org/z/h33naE7W5)）：

```c
// 编译参数：riscv32-unknown-elf-gcc -O0 -S

#include <stdarg.h>

void f(long long a);

void long_args(int a1, int a2, int a3, int a4, int a5, int a6, int a7, long long a8, int a9)
{
  f(a8);
}

int va_sum(int args_num, ...)
{
  int sum = 0;
  va_list ap;
  va_start(ap, args_num);
  for (int i = args_num; i > 0; i--)
  {
    int arg = va_arg(ap, int);
    sum = sum + arg;
  }
  va_end(ap);
  return sum;
}

int main()
{
  long long *data = (long long*)__builtin_alloca(sizeof(long long));
  *data = 0x900000008ll;
  long_args(1, 2, 3, 4, 5, 6, 7, *data, 10);
  va_sum(8, 1, 2, 3, 4, 5, 6, 7, 8);
}
```

生成的汇编如下（注意`-O0`编译参数会将所有的参数和局部变量存储到栈上，在更高优化等级上会被优化，但是传参的方式会保持一致）：

```
long_args:
        addi    sp,sp,-64
        sw      ra,44(sp)
        sw      s0,40(sp)
        addi    s0,sp,48
        sw      a0,-20(s0)
        sw      a1,-24(s0)
        sw      a2,-28(s0)
        sw      a3,-32(s0)
        sw      a4,-36(s0)
        sw      a5,-40(s0)
        sw      a6,-44(s0)
        sw      a7,12(s0)
        lw      a0,12(s0)
        lw      a1,16(s0)
        call    f
        nop
        lw      ra,44(sp)
        lw      s0,40(sp)
        addi    sp,sp,64
        jr      ra
va_sum:
        addi    sp,sp,-80
        sw      s0,44(sp)
        addi    s0,sp,48
        sw      a0,-36(s0)
        sw      a1,4(s0)
        sw      a2,8(s0)
        sw      a3,12(s0)
        sw      a4,16(s0)
        sw      a5,20(s0)
        sw      a6,24(s0)
        sw      a7,28(s0)
        sw      zero,-20(s0)
        addi    a5,s0,32
        sw      a5,-40(s0)
        lw      a5,-40(s0)
        addi    a5,a5,-28
        sw      a5,-32(s0)
        lw      a5,-36(s0)
        sw      a5,-24(s0)
        j       .L3
.L4:
        lw      a5,-32(s0)
        addi    a4,a5,4
        sw      a4,-32(s0)
        lw      a5,0(a5)
        sw      a5,-28(s0)
        lw      a4,-20(s0)
        lw      a5,-28(s0)
        add     a5,a4,a5
        sw      a5,-20(s0)
        lw      a5,-24(s0)
        addi    a5,a5,-1
        sw      a5,-24(s0)
.L3:
        lw      a5,-24(s0)
        bgt     a5,zero,.L4
        lw      a5,-20(s0)
        mv      a0,a5
        lw      s0,44(sp)
        addi    sp,sp,80
        jr      ra
main:
        addi    sp,sp,-48
        sw      ra,44(sp)
        sw      s0,40(sp)
        addi    s0,sp,48
        addi    sp,sp,-16
        addi    a5,sp,8
        addi    a5,a5,15
        srli    a5,a5,4
        slli    a5,a5,4
        sw      a5,-20(s0)
        lw      a3,-20(s0)
        li      a4,8
        li      a5,9
        sw      a4,0(a3)
        sw      a5,4(a3)
        lw      a5,-20(s0)
        lw      a4,0(a5)
        lw      a5,4(a5)
        li      a3,10
        sw      a3,4(sp)
        sw      a5,0(sp)
        mv      a7,a4
        li      a6,7
        li      a5,6
        li      a4,5
        li      a3,4
        li      a2,3
        li      a1,2
        li      a0,1
        call    long_args
        li      a5,8
        sw      a5,0(sp)
        li      a7,7
        li      a6,6
        li      a5,5
        li      a4,4
        li      a3,3
        li      a2,2
        li      a1,1
        li      a0,8
        call    va_sum
        li      a5,0
        mv      a0,a5
        addi    sp,s0,-48
        lw      ra,44(sp)
        lw      s0,40(sp)
        addi    sp,sp,48
        jr      ra
```

汇编分析：

- main函数调用long_args函数时

  - caller为main函数，callee为long_args函数

  - long_args函数9个参数，其中arg8为long long类型（size为8字节），需要占用2个寄存器，其余参数均只占用一个寄存器

  - 根据RISC-V调用约定，在main调用long_args函数之前，需要将前7个参数（arg1-arg7）放入寄存器a0-a6，arg8的低4字节内容放入寄存器a7，高4字节内容放入对应栈位置（即caller的outgoing stack arguments区域），arg9放入对应栈位置（即caller的outgoing stack arguments区域）。

  - 对应的在long_args中，将存放arg8的低4字节寄存器a7中的值存入栈帧（即callee-allocated save area for arguments that are split between registers and the stack区域）。在long_args中，会继续将arg8传给f函数，因此需要将arg8通过寄存器a0和a1传递。

  - stack frame snapshot when main call long_args

    ```
    |===============================|<-- main function stack frame start (total 64 bytes)
    |    ra(4)                      |\
    |-------------------------------| \
    |    s0(4)                      |  | GPR save area (16)
    |-------------------------------| /
    |    padding(8)                 |/
    |===============================|
    |    data(4)                    |\
    |-------------------------------| | local variables (16)
    |    padding(12)                |/
    |===============================|
    |    *data(8)                   |\
    |-------------------------------| | dynamic allocation (16)
    |    padding(8)                 |/
    |===============================|
    |    padding(8)                 |\
    |-------------------------------| \
    |    arg9(4)                    |  | outgoing stack arguments (16)
    |-------------------------------| /
    |    arg8_high(4)               |/
    |===============================|<-- caller sp, long_args function stack frame start (total 64 bytes)
    |    a7/arg8_low(4)             |\  virtual-incoming-args + 4
    |-------------------------------|
    |    align STACK_BYTES(4)          |
    |-------------------------------| | callee-allocated save area for arguments that
    |    padding(8)                |/  are split between registers and the stack (16)
    |===============================|
    |    ra(4)                      |\
    |-------------------------------| \
    |    s0(4)                      |  | GPR save area (16)
    |-------------------------------| /
    |    padding(8)                 |/
    |===============================|<-- virtual-stack-vars
    |    a0(4)                      |\   vitrual-stack-vars - 4
    |-------------------------------| \
    |    a1(4)                      |  \
    |-------------------------------|   \
    |    a2(4)                      |    \
    |-------------------------------|     \
    |    a3(4)                      |      \
    |-------------------------------|       | local variables (32)
    |    a4(4)                      |      /
    |-------------------------------|     /
    |    a5(4)                      |    /
    |-------------------------------|   /
    |    a6(4)                      |  /
    |-------------------------------| /
    |    padding(4)                 |/
    |===============================|<-- callee sp
    ```

- main函数调用var_sum函数时

  - caller为main函数，callee为var_sum函数

  - 根据RISC-V调用约定，var_sum函数为可变参函数，除了第一个参数外，其他参数都是匿名参数。在main中调用var_sum前，需要将第一个参数放入寄存器a0，之后的匿名参数中，第1到7个匿名参数放入寄存器a1-a7，其余匿名参数通过函数栈帧传入（即caller的outgoing stack arguments区域）。

  - 对应的在var_sum函数中，需要将通过a1-a7传入的参数存储到对应栈帧区域（即callee的callee-allocated save area for register varargs区域）

  - stack frame snapshot when main call var_sum

    ```
    |===============================|<-- main function stack frame start (total 64 bytes)
    |    ra(4)                      |\
    |-------------------------------| \
    |    s0(4)                      |  | GPR save area (16)
    |-------------------------------| /
    |    padding(8)                 |/
    |===============================|
    |    data(4)                    |\
    |-------------------------------| | local variables (16)
    |    padding(12)                |/
    |===============================|
    |    *data(8)                   |\
    |-------------------------------| | dynamic allocation (16)
    |    padding(8)                 |/
    |===============================|
    |    padding(12)                |\
    |-------------------------------| | outgoing stack arguments (16)
    |    vararg8(4)                 |/
    |===============================|<-- virtual-incoming-args, caller sp, var_sum function stack frame start (total 80 bytes)
    |    a7/vararg7(4)              |\
    |-------------------------------| \
    |    a6/vararg6(4)              |  \
    |-------------------------------|   \
    |    a5/vararg5(4)              |    \
    |-------------------------------|     \
    |    a4/vararg4(4)              |      \
    |-------------------------------|       | callee-allocated save area
    |    a3/vararg3(4)              |      /  for register varargs (32)
    |-------------------------------|     /
    |    a2/vararg2(4)              |    /
    |-------------------------------|   /
    |    a1/vararg1(4)              |  /
    |-------------------------------| / --> ap
    |    padding(4)                 |/
    |===============================|
    |    s0(4)                      |\
    |-------------------------------| | GPR save area (16)
    |    padding(12)                |/ 
    |===============================|<-- virtual-stack-vars
    |    sum(4)                     |\
    |-------------------------------| \
    |    i(4)                       |  \
    |-------------------------------|   \
    |    arg(4)                     |    \
    |-------------------------------|     \
    |    ap(4)                      |      | local variables (32)
    |-------------------------------|     /
    |    a0/args_num(4)             |    /
    |-------------------------------|   /
    |    calee sp(4)                |  /
    |-------------------------------| /
    |    padding(8)                 |/
    |===============================|<-- callee sp
    ```

## GCC实现

### Gimple IR到RTL IR的转换

additational option: -fdump-tree-optimized -fdump-rtl-expand

从下面对应的Gimple IR可以看出跟C代码类似，使用变量。当其被lowering到RTL IR的时候，才会根据TARGET的ABI约定进行传参。

```c
long_args (int a1, int a2, int a3, int a4, int a5, int a6, int a7, long long int a8, int a9)
{
  <bb 2> :
  f (a8_2(D));
  return;

}

va_sum (int args_num)
{
  void * D.1487;
  void * D.1488;
  int arg;
  int i;
  void * ap;
  int sum;
  int D.1479;
  int _10;

  <bb 2> :
  sum_4 = 0;
  __builtin_va_start (&ap, 0);
  i_8 = args_num_7(D);
  goto <bb 4>; [INV]

  <bb 3> :
  _16 = ap;
  _17 = _16 + 4;
  ap = _17;
  arg_13 = MEM[(int *)_16];
  sum_14 = sum_1 + arg_13;
  i_15 = i_2 + -1;

  <bb 4> :
  # sum_1 = PHI <sum_4(2), sum_14(3)>
  # i_2 = PHI <i_8(2), i_15(3)>
  if (i_2 > 0)
    goto <bb 3>; [INV]
  else
    goto <bb 5>; [INV]

  <bb 5> :
  __builtin_va_end (&ap);
  _10 = sum_1;
  ap ={v} {CLOBBER};

  <bb 6> :
  return _10;

}


main ()
{
  long long int * data;
  int D.1482;
  long long int _1;
  int _8;

  <bb 2> :
  data_4 = __builtin_alloca (8);
  *data_4 = 38654705672;
  _1 = *data_4;
  long_args (1, 2, 3, 4, 5, 6, 7, _1, 10);
  va_sum (8, 1, 2, 3, 4, 5, 6, 7, 8);
  _8 = 0;

  <bb 3> :
  return _8;

}
```

首先看在main中调用long_args的rtl代码是如何传递参数的，主要涉及到如下RTL。其中a0到a6分别存放arg1~arg7参数（指令20到26）。而arg8参数（即reg 134）分成了2部分，低4字节存放在a7寄存器（指令19），高4字节存放在virtual-outgoing-args+0的内存位置（指令18）。然后arg9存放在virtual-outgoing-args+4的内存位置（指令17）。

然后是调用va_sum的代码。可以看到在调用端调用可变参数函数时，其中参数1到参数8存储在寄存器上（指令30到37），而参数9通过`outgoing`区域传递（指令28和29），跟调用不可变参数函数一致，并没有什么特别的。实际上，调用端并不知道所调用的函数是可变的还是不可变的函数。区别主要体现在函数如何接受参数上面。

```lisp
(insn 5 2 6 2 (set (reg/f:SI 2 sp)
        (plus:SI (reg/f:SI 2 sp)
            (const_int -16 [0xfffffffffffffff0]))) "/app/example.c":28:33 -1
     (nil))
(insn 6 5 7 2 (set (reg:SI 75)
        (reg/f:SI 68 virtual-stack-dynamic)) "/app/example.c":28:33 -1
     (nil))
(insn 7 6 8 2 (set (reg:SI 76)
        (plus:SI (reg:SI 75)
            (const_int 15 [0xf]))) "/app/example.c":28:33 -1
     (nil))
(insn 8 7 9 2 (set (reg:SI 77)
        (lshiftrt:SI (reg:SI 76)
            (const_int 4 [0x4]))) "/app/example.c":28:33 -1
     (expr_list:REG_EQUAL (udiv:SI (reg:SI 76)
            (const_int 16 [0x10]))
        (nil)))
(insn 9 8 10 2 (set (reg/f:SI 78)
        (ashift:SI (reg:SI 77)
            (const_int 4 [0x4]))) "/app/example.c":28:33 -1
     (nil))
(insn 10 9 11 2 (set (mem/f/c:SI (plus:SI (reg/f:SI 67 virtual-stack-vars)
                (const_int -4 [0xfffffffffffffffc])) [6 data+0 S4 A32])
        (reg/f:SI 78)) "/app/example.c":28:33 -1
     (nil))
(insn 11 10 12 2 (set (reg/f:SI 79)
        (mem/f/c:SI (plus:SI (reg/f:SI 67 virtual-stack-vars)
                (const_int -4 [0xfffffffffffffffc])) [6 data+0 S4 A32])) "/app/example.c":29:9 -1
     (nil))
(insn 12 11 13 2 (set (reg:DI 80)
        (const_int 38654705672 [0x900000008])) "/app/example.c":29:9 -1
     (nil))
(insn 13 12 14 2 (set (mem:DI (reg/f:SI 79) [2 *data_4+0 S8 A64])
        (reg:DI 80)) "/app/example.c":29:9 -1
     (nil))
(insn 14 13 15 2 (set (reg/f:SI 81)
        (mem/f/c:SI (plus:SI (reg/f:SI 67 virtual-stack-vars)
                (const_int -4 [0xfffffffffffffffc])) [6 data+0 S4 A32])) "/app/example.c":30:3 -1
     (nil))
(insn 15 14 16 2 (set (reg:DI 72 [ _1 ])
        (mem:DI (reg/f:SI 81) [2 *data_4+0 S8 A64])) "/app/example.c":30:3 -1
     (nil))
(insn 16 15 17 2 (set (reg:SI 82)
        (const_int 10 [0xa])) "/app/example.c":30:3 -1
     (nil))
(insn 17 16 18 2 (set (mem:SI (plus:SI (reg/f:SI 69 virtual-outgoing-args)
                (const_int 4 [0x4])) [0  S4 A32])
        (reg:SI 82)) "/app/example.c":30:3 -1
     (nil))
(insn 18 17 19 2 (set (mem:SI (reg/f:SI 69 virtual-outgoing-args) [0  S4 A64])
        (subreg:SI (reg:DI 72 [ _1 ]) 4)) "/app/example.c":30:3 -1
     (nil))
(insn 19 18 20 2 (set (reg:SI 17 a7)
        (subreg:SI (reg:DI 72 [ _1 ]) 0)) "/app/example.c":30:3 -1
     (nil))
(insn 20 19 21 2 (set (reg:SI 16 a6)
        (const_int 7 [0x7])) "/app/example.c":30:3 -1
     (nil))
(insn 21 20 22 2 (set (reg:SI 15 a5)
        (const_int 6 [0x6])) "/app/example.c":30:3 -1
     (nil))
(insn 22 21 23 2 (set (reg:SI 14 a4)
        (const_int 5 [0x5])) "/app/example.c":30:3 -1
     (nil))
(insn 23 22 24 2 (set (reg:SI 13 a3)
        (const_int 4 [0x4])) "/app/example.c":30:3 -1
     (nil))
(insn 24 23 25 2 (set (reg:SI 12 a2)
        (const_int 3 [0x3])) "/app/example.c":30:3 -1
     (nil))
(insn 25 24 26 2 (set (reg:SI 11 a1)
        (const_int 2 [0x2])) "/app/example.c":30:3 -1
     (nil))
(insn 26 25 27 2 (set (reg:SI 10 a0)
        (const_int 1 [0x1])) "/app/example.c":30:3 -1
     (nil))
(call_insn 27 26 28 2 (parallel [
            (call (mem:SI (symbol_ref:SI ("long_args") [flags 0x3]  <function_decl 0x7f3279235300 long_args>) [0 long_args S4 A32])
                (const_int 8 [0x8]))
            (clobber (reg:SI 1 ra))
        ]) "/app/example.c":30:3 -1
     (nil)
    (expr_list:SI (use (reg:SI 10 a0))
        (expr_list:SI (use (reg:SI 11 a1))
            (expr_list:SI (use (reg:SI 12 a2))
                (expr_list:SI (use (reg:SI 13 a3))
                    (expr_list:SI (use (reg:SI 14 a4))
                        (expr_list:SI (use (reg:SI 15 a5))
                            (expr_list:SI (use (reg:SI 16 a6))
                                (expr_list (use (reg:SI 17 a7))
                                    (expr_list:DI (use (mem:SI (reg/f:SI 69 virtual-outgoing-args) [0  S4 A64]))
                                        (expr_list:SI (use (mem:SI (plus:SI (reg/f:SI 69 virtual-outgoing-args)
                                                        (const_int 4 [0x4])) [0  S4 A32]))
                                            (nil))))))))))))
(insn 28 27 29 2 (set (reg:SI 83)
        (const_int 8 [0x8])) "/app/example.c":31:3 -1
     (nil))
(insn 29 28 30 2 (set (mem:SI (reg/f:SI 69 virtual-outgoing-args) [0  S4 A32])
        (reg:SI 83)) "/app/example.c":31:3 -1
     (nil))
(insn 30 29 31 2 (set (reg:SI 17 a7)
        (const_int 7 [0x7])) "/app/example.c":31:3 -1
     (nil))
(insn 31 30 32 2 (set (reg:SI 16 a6)
        (const_int 6 [0x6])) "/app/example.c":31:3 -1
     (nil))
(insn 32 31 33 2 (set (reg:SI 15 a5)
        (const_int 5 [0x5])) "/app/example.c":31:3 -1
     (nil))
(insn 33 32 34 2 (set (reg:SI 14 a4)
        (const_int 4 [0x4])) "/app/example.c":31:3 -1
     (nil))
(insn 34 33 35 2 (set (reg:SI 13 a3)
        (const_int 3 [0x3])) "/app/example.c":31:3 -1
     (nil))
(insn 35 34 36 2 (set (reg:SI 12 a2)
        (const_int 2 [0x2])) "/app/example.c":31:3 -1
     (nil))
(insn 36 35 37 2 (set (reg:SI 11 a1)
        (const_int 1 [0x1])) "/app/example.c":31:3 -1
     (nil))
(insn 37 36 38 2 (set (reg:SI 10 a0)
        (const_int 8 [0x8])) "/app/example.c":31:3 -1
     (nil))
(call_insn 38 37 39 2 (parallel [
            (set (reg:SI 10 a0)
                (call (mem:SI (symbol_ref:SI ("va_sum") [flags 0x3]  <function_decl 0x7f3279235400 va_sum>) [0 va_sum S4 A32])
                    (const_int 8 [0x8])))
            (clobber (reg:SI 1 ra))
        ]) "/app/example.c":31:3 -1
     (nil)
    (expr_list:SI (use (reg:SI 10 a0))
        (expr_list:SI (use (reg:SI 11 a1))
            (expr_list:SI (use (reg:SI 12 a2))
                (expr_list:SI (use (reg:SI 13 a3))
                    (expr_list:SI (use (reg:SI 14 a4))
                        (expr_list:SI (use (reg:SI 15 a5))
                            (expr_list:SI (use (reg:SI 16 a6))
                                (expr_list:SI (use (reg:SI 17 a7))
                                    (expr_list:SI (use (mem:SI (reg/f:SI 69 virtual-outgoing-args) [0  S4 A32]))
                                        (nil)))))))))))
(insn 39 38 42 2 (set (reg:SI 73 [ _8 ])
        (const_int 0 [0])) "<built-in>":0:0 -1
     (nil))
(insn 42 39 46 2 (set (reg:SI 74 [ <retval> ])
        (reg:SI 73 [ _8 ])) "<built-in>":0:0 -1
     (nil))
(insn 46 42 47 2 (set (reg/i:SI 10 a0)
        (reg:SI 74 [ <retval> ])) "/app/example.c":32:1 -1
     (nil))
(insn 47 46 0 2 (use (reg/i:SI 10 a0)) "/app/example.c":32:1 -1
     (nil))
```

接来下看下long_args是如何接收参数和返回内容的，如下代码所示。可以看到a7（arg8的低4字节内容）被存储到virtual-incoming-args + 4的位置（指令13）。为什么是+4呢？这是因为arg8有4字节会通过寄存器传递，即GCC中的pretend_args_size字段为4字节，RV32下会做STACK_BYTES对齐之后为8字节。因此需要分配8字节的`partial register`区域。virtual-incoming-args指向virtual-outgoing-args - pretend_args_size的位置。因此virtual-incoming-args + 4就和main中的virtual-outgoing-args - 4一致。将a7中的内容存储到virtual-outgoing-args - 4中就和放在virtual-outgoing-args处的arg8的高4字节相邻，两者合并组成了完整的arg8的内容。随后将其内容加载到寄存器a0和a1中（指令13），然后传给函数f作为其第一个参数。

```lisp
(insn 2 11 3 2 (set (mem/c:SI (plus:SI (reg/f:SI 67 virtual-stack-vars)
                (const_int -4 [0xfffffffffffffffc])) [1 a1+0 S4 A32])
        (reg:SI 10 a0 [ a1 ])) "/app/example.c":8:1 -1
     (nil))
(insn 3 2 4 2 (set (mem/c:SI (plus:SI (reg/f:SI 67 virtual-stack-vars)
                (const_int -8 [0xfffffffffffffff8])) [1 a2+0 S4 A32])
        (reg:SI 11 a1 [ a2 ])) "/app/example.c":8:1 -1
     (nil))
(insn 4 3 5 2 (set (mem/c:SI (plus:SI (reg/f:SI 67 virtual-stack-vars)
                (const_int -12 [0xfffffffffffffff4])) [1 a3+0 S4 A32])
        (reg:SI 12 a2 [ a3 ])) "/app/example.c":8:1 -1
     (nil))
(insn 5 4 6 2 (set (mem/c:SI (plus:SI (reg/f:SI 67 virtual-stack-vars)
                (const_int -16 [0xfffffffffffffff0])) [1 a4+0 S4 A32])
        (reg:SI 13 a3 [ a4 ])) "/app/example.c":8:1 -1
     (nil))
(insn 6 5 7 2 (set (mem/c:SI (plus:SI (reg/f:SI 67 virtual-stack-vars)
                (const_int -20 [0xffffffffffffffec])) [1 a5+0 S4 A32])
        (reg:SI 14 a4 [ a5 ])) "/app/example.c":8:1 -1
     (nil))
(insn 7 6 8 2 (set (mem/c:SI (plus:SI (reg/f:SI 67 virtual-stack-vars)
                (const_int -24 [0xffffffffffffffe8])) [1 a6+0 S4 A32])
        (reg:SI 15 a5 [ a6 ])) "/app/example.c":8:1 -1
     (nil))
(insn 8 7 9 2 (set (mem/c:SI (plus:SI (reg/f:SI 67 virtual-stack-vars)
                (const_int -28 [0xffffffffffffffe4])) [1 a7+0 S4 A32])
        (reg:SI 16 a6 [ a7 ])) "/app/example.c":8:1 -1
     (nil))
(insn 9 8 10 2 (set (mem/c:SI (plus:SI (reg/f:SI 66 virtual-incoming-args)
                (const_int 4 [0x4])) [2 a8+0 S4 A64])
        (reg:SI 17 a7)) "/app/example.c":8:1 -1
     (nil))
(insn 13 10 14 2 (set (reg:DI 10 a0)
        (mem/c:DI (plus:SI (reg/f:SI 66 virtual-incoming-args)
                (const_int 4 [0x4])) [2 a8+0 S8 A64])) "/app/example.c":9:3 -1
     (nil))
(call_insn 14 13 0 2 (parallel [
            (call (mem:SI (symbol_ref:SI ("f") [flags 0x41]  <function_decl 0x7f3279235200 f>) [0 f S4 A32])
                (const_int 0 [0]))
            (clobber (reg:SI 1 ra))
        ]) "/app/example.c":9:3 -1
     (nil)
    (expr_list:DI (use (reg:DI 10 a0))
        (nil)))
```

下面的代码体现了其逻辑。

```c++
/* gcc/config/riscv/riscv.cc */
static void
riscv_compute_frame_info (void)
{
  ...
  /* At the bottom of the frame are any outgoing stack arguments. */
  offset = riscv_stack_align (crtl->outgoing_args_size);
  /* Next are local stack variables. */
  offset += riscv_stack_align (get_frame_size ());
  /* The virtual frame pointer points above the local variables. */
  frame->frame_pointer_offset = offset;
  /* Next are the callee-saved FPRs. */
  if (frame->fmask)
    offset += riscv_stack_align (num_f_saved * UNITS_PER_FP_REG);

  frame->fp_sp_offset = offset - UNITS_PER_FP_REG;
  /* Next are the callee-saved GPRs. */
  if (frame->mask)
    offset += riscv_stack_align (num_x_saved * UNITS_PER_WORD);
  
  // 减去UNITS_PER_WORD的目的因该是为了使stack_pointer_rtx + gp_sp_offset指向第一个callee-saved寄存器，上面的fp_sp_offset也是类似的。
  frame->gp_sp_offset = offset - UNITS_PER_WORD;
  /* The hard frame pointer points above the callee-saved GPRs. */
  frame->hard_frame_pointer_offset = offset;
  // varargs_size和pretend_args_size最多有一个不为0，或者两个都为0
  /* Above the hard frame pointer is the callee-allocated varags save area. */
  offset += riscv_stack_align (cfun->machine->varargs_size);
  /* Next is the callee-allocated area for pretend stack arguments.  */
  offset += riscv_stack_align (crtl->args.pretend_args_size);
  /* Arg pointer must be below pretend args, but must be above alignment
     padding.  */
  // 如果pretend_args_size为0，即没有出现部分通过寄存器传递的情况，则callee的virtual-incoming-args跟caller的virtual-outgoing-args一致
  // 如果pretend_args_size不为0，则需要调整virtual-incoming-args为virtual-outgoing-args-pretend_args_size
  frame->arg_pointer_offset = offset - crtl->args.pretend_args_size;
  ...
}
```

接下来分析va_sum可变参函数是如何接受参数的。在va_sum中，只有第一个参数args_num显式指定，其余参数个数未知。这种情况下，GCC不管三七二十一，会将剩余通过匿名寄存器传递的参数一股脑的存储到`varargs`区域，从而和通过栈传入的后续匿名参数（如果有的话）的`incoming`区域合并起来。因此，定义匿名函数是有代价的，假如只有一个具名寄存器参数，那么`varargs`区域的大小为（8-1）*4=28字节，即使实际上匿名参数只有一两个。

在访问匿名参数的时候，ap变量指向`varargs`区域，每当执行`va_arg(ap, int)`时，就会对ap递增`sizeof int`字节。从这里可以看出来，匿名参数传入时的类型和访问匿名参数时解释的类型没有关联。

```lisp
(insn 2 11 3 2 (set (mem/c:SI (plus:SI (reg/f:SI 67 virtual-stack-vars)
                (const_int -20 [0xffffffffffffffec])) [1 args_num+0 S4 A32])
        (reg:SI 10 a0 [ args_num ])) "/app/example.c":13:1 -1
     (nil))
(insn 3 2 4 2 (set (mem/c:SI (plus:SI (reg/f:SI 66 virtual-incoming-args)
                (const_int -28 [0xffffffffffffffe4])) [0  S4 A8])
        (reg:SI 11 a1)) "/app/example.c":13:1 -1
     (nil))
(insn 4 3 5 2 (set (mem/c:SI (plus:SI (reg/f:SI 66 virtual-incoming-args)
                (const_int -24 [0xffffffffffffffe8])) [0  S4 A8])
        (reg:SI 12 a2)) "/app/example.c":13:1 -1
     (nil))
(insn 5 4 6 2 (set (mem/c:SI (plus:SI (reg/f:SI 66 virtual-incoming-args)
                (const_int -20 [0xffffffffffffffec])) [0  S4 A8])
        (reg:SI 13 a3)) "/app/example.c":13:1 -1
     (nil))
(insn 6 5 7 2 (set (mem/c:SI (plus:SI (reg/f:SI 66 virtual-incoming-args)
                (const_int -16 [0xfffffffffffffff0])) [0  S4 A8])
        (reg:SI 14 a4)) "/app/example.c":13:1 -1
     (nil))
(insn 7 6 8 2 (set (mem/c:SI (plus:SI (reg/f:SI 66 virtual-incoming-args)
                (const_int -12 [0xfffffffffffffff4])) [0  S4 A8])
        (reg:SI 15 a5)) "/app/example.c":13:1 -1
     (nil))
(insn 8 7 9 2 (set (mem/c:SI (plus:SI (reg/f:SI 66 virtual-incoming-args)
                (const_int -8 [0xfffffffffffffff8])) [0  S4 A8])
        (reg:SI 16 a6)) "/app/example.c":13:1 -1
     (nil))
(insn 9 8 10 2 (set (mem/c:SI (plus:SI (reg/f:SI 66 virtual-incoming-args)
                (const_int -4 [0xfffffffffffffffc])) [0  S4 A8])
        (reg:SI 17 a7)) "/app/example.c":13:1 -1
     (nil))
(note 10 9 13 2 NOTE_INSN_FUNCTION_BEG)
(insn 13 10 14 2 (set (mem/c:SI (plus:SI (reg/f:SI 67 virtual-stack-vars)
                (const_int -4 [0xfffffffffffffffc])) [1 sum+0 S4 A32])
        (const_int 0 [0])) "/app/example.c":14:7 -1
     (nil))
(insn 14 13 15 2 (set (reg:SI 76)
        (plus:SI (reg/f:SI 66 virtual-incoming-args)
            (const_int 0 [0]))) "/app/example.c":16:3 -1
     (nil))
(insn 15 14 16 2 (set (reg:SI 77)
        (plus:SI (reg:SI 76)
            (const_int -28 [0xffffffffffffffe4]))) "/app/example.c":16:3 -1
     (nil))
(insn 16 15 17 2 (set (mem/f/c:SI (plus:SI (reg/f:SI 67 virtual-stack-vars)
                (const_int -16 [0xfffffffffffffff0])) [4 MEM[(void * *)&ap]+0 S4 A64])
        (reg:SI 77)) "/app/example.c":16:3 -1
     (nil))
(insn 17 16 18 2 (set (reg:SI 78)
        (mem/c:SI (plus:SI (reg/f:SI 67 virtual-stack-vars)
                (const_int -20 [0xffffffffffffffec])) [1 args_num+0 S4 A32])) "/app/example.c":17:12 -1
     (nil))
(insn 18 17 19 2 (set (mem/c:SI (plus:SI (reg/f:SI 67 virtual-stack-vars)
                (const_int -8 [0xfffffffffffffff8])) [1 i+0 S4 A64])
        (reg:SI 78)) "/app/example.c":17:12 -1
     (nil))
(jump_insn 19 18 20 2 (set (pc)
        (label_ref 34)) "/app/example.c":17:3 -1
     (nil)
 -> 34)
(barrier 20 19 36)
(code_label 36 20 21 4 4 (nil) [1 uses])
(insn 22 21 23 4 (set (reg/f:SI 73 [ D.1490 ])
        (mem/f/c:SI (plus:SI (reg/f:SI 67 virtual-stack-vars)
                (const_int -16 [0xfffffffffffffff0])) [4 ap+0 S4 A64])) "/app/example.c":19:9 -1
     (nil))
(insn 23 22 24 4 (set (reg/f:SI 74 [ D.1491 ])
        (plus:SI (reg/f:SI 73 [ D.1490 ])
            (const_int 4 [0x4]))) "/app/example.c":19:9 -1
     (nil))
(insn 24 23 25 4 (set (mem/f/c:SI (plus:SI (reg/f:SI 67 virtual-stack-vars)
                (const_int -16 [0xfffffffffffffff0])) [4 ap+0 S4 A64])
        (reg/f:SI 74 [ D.1491 ])) "/app/example.c":19:9 -1
     (nil))
(insn 25 24 26 4 (set (reg:SI 79)
        (mem:SI (reg/f:SI 73 [ D.1490 ]) [1 MEM[(int *)_16]+0 S4 A32])) "/app/example.c":19:9 -1
     (nil))
(insn 26 25 27 4 (set (mem/c:SI (plus:SI (reg/f:SI 67 virtual-stack-vars)
                (const_int -12 [0xfffffffffffffff4])) [1 arg+0 S4 A32])
        (reg:SI 79)) "/app/example.c":19:9 -1
     (nil))
(insn 27 26 28 4 (set (reg:SI 81)
        (mem/c:SI (plus:SI (reg/f:SI 67 virtual-stack-vars)
                (const_int -4 [0xfffffffffffffffc])) [1 sum+0 S4 A32])) "/app/example.c":20:9 -1
     (nil))
(insn 28 27 29 4 (set (reg:SI 82)
        (mem/c:SI (plus:SI (reg/f:SI 67 virtual-stack-vars)
                (const_int -12 [0xfffffffffffffff4])) [1 arg+0 S4 A32])) "/app/example.c":20:9 -1
     (nil))
(insn 29 28 30 4 (set (reg:SI 80)
        (plus:SI (reg:SI 81)
            (reg:SI 82))) "/app/example.c":20:9 -1
     (nil))
(insn 30 29 31 4 (set (mem/c:SI (plus:SI (reg/f:SI 67 virtual-stack-vars)
                (const_int -4 [0xfffffffffffffffc])) [1 sum+0 S4 A32])
        (reg:SI 80)) "/app/example.c":20:9 -1
     (nil))
(insn 31 30 32 4 (set (reg:SI 84)
        (mem/c:SI (plus:SI (reg/f:SI 67 virtual-stack-vars)
                (const_int -8 [0xfffffffffffffff8])) [1 i+0 S4 A64])) "/app/example.c":17:34 -1
     (nil))
(insn 32 31 33 4 (set (reg:SI 83)
        (plus:SI (reg:SI 84)
            (const_int -1 [0xffffffffffffffff]))) "/app/example.c":17:34 -1
     (nil))
(insn 33 32 34 4 (set (mem/c:SI (plus:SI (reg/f:SI 67 virtual-stack-vars)
                (const_int -8 [0xfffffffffffffff8])) [1 i+0 S4 A64])
        (reg:SI 83)) "/app/example.c":17:34 -1
     (nil))
(code_label 34 33 35 5 3 (nil) [1 uses])
(insn 39 35 40 5 (set (reg:SI 85)
        (mem/c:SI (plus:SI (reg/f:SI 67 virtual-stack-vars)
                (const_int -8 [0xfffffffffffffff8])) [1 i+0 S4 A64])) "/app/example.c":17:28 -1
     (nil))
(jump_insn 40 39 41 5 (set (pc)
        (if_then_else (gt (reg:SI 85)
                (const_int 0 [0]))
            (label_ref 36)
            (pc))) "/app/example.c":17:28 -1
     (nil)
 -> 36)
(insn 42 41 45 6 (set (reg:SI 72 [ _10 ])
        (mem/c:SI (plus:SI (reg/f:SI 67 virtual-stack-vars)
                (const_int -4 [0xfffffffffffffffc])) [1 sum+0 S4 A32])) "/app/example.c":23:10 -1
     (nil))
(insn 45 42 49 6 (set (reg:SI 75 [ <retval> ])
        (reg:SI 72 [ _10 ])) "/app/example.c":23:10 -1
     (nil))
(insn 49 45 50 6 (set (reg/i:SI 10 a0)
        (reg:SI 75 [ <retval> ])) "/app/example.c":24:1 -1
     (nil))
(insn 50 49 0 6 (use (reg/i:SI 10 a0)) "/app/example.c":24:1 -1
     (nil))
```

### 调用传参实现

调用过程主要就是确定传递给函数的各个参数使用的传递方式（寄存器或者栈）。

主要涉及一下几个部分：

1. 调用Hooks TARGET_FUNCTION_ARG 和 TARGET_ARG_PARTIAL_BYTES 确定每个参数如何传递（根据RISC-V的调用约定），确定这些问题：当前参数完全通过寄存器传递？当前参数部分通过寄存器，部分通过栈传递？当前参数全部通过栈传递？
2. expand每个参数，将对应的结果放到对应的位置（栈参数的位置为virtual_outgoing_args_rtx + arg_offset）并生成对应RTX指令。在小端模式下，栈参数按照远离callee栈帧方向存放（即前面的栈参数靠近callee栈帧，后面的栈参数远离callee栈帧）。
3. 在处理函数体中的函数调用时，根据需要更新outgoing区域的最大值。

涉及代码如下：

```c
/* gcc/calls.cc */
rtx expand_call (tree exp, rtx target, int ignore)
{

  /* 为1表示函数将返回值存到传入的返回内存地址参数中 */
  int structure_value_addr_parm;
  /* 参数总个数，包含返回值参数（如果需要的话） */
  int num_actuals;
  /* 命名参数个数 */
  int n_named_args;
  /* 存储每个参数的信息，比如通过寄存器还是stack传递 */
  struct arg_data *args;
  /* 栈参数的大小，每处理一个栈参数就会更新一次 */
  struct args_size args_size;

  /* 记录已分配的参数信息，该结构由machine自定义。
     可以用来记录前面参数寄存器的分配情况 */
  CUMULATIVE_ARGS args_so_far_v;
  cumulative_args_t args_so_far;

  /* 表示machine是否提供push入栈指令，如果不提供，这需要提前分配好所需的outgoing区域，argblock为该区域的地址 */
  int must_preallocate = !targetm.calls.push_argument (0);
  rtx argblock = 0;

  num_actuals =
    call_expr_nargs (exp) + num_complex_actuals + structure_value_addr_parm;

  /* 调用machine定义的INIT_CUMULATIVE_ARGS进行初始化 */
  INIT_CUMULATIVE_ARGS (args_so_far_v, funtype, NULL_RTX, fndecl, n_named_args);
  args_so_far = pack_cumulative_args (&args_so_far_v);

  /* 创建存储参数的数组（逆序存放） */
  args = XCNEWVEC (struct arg_data, num_actuals);

  /* 确定每个参数的传递方式和大小，保存在args数组和args_size中
     如果参数内容通过寄存器传参，则args[i].reg为1；
     如果参数只是部分内容通过寄存器传参，则args[i].partial也不为0，其值表示通过寄存器传参的size；
     如果通过栈传参，则args[i].locate为参数在栈上的偏移量
     涉及的HOOKS：
       TARGET_FUNCTION_ARG 确定参数是否从reg传递
       TARGET_ARG_PARTIAL_BYTES 计算通过register传递的大小，可以部分通过寄存器，部分通过栈传递 */
  initialize_argument_information (num_actuals, args, &args_size,
                                   n_named_args, exp,
                                   structure_value_addr_value, fndecl, fntype,
                                   args_so_far, reg_parm_stack_space,
                                   &old_stack_level, &old_pending_adj,
                                   &must_preallocate, &flags,
                                   &try_tail_call, CALL_FROM_THUNK_P (exp));

  for (pass = try_tail_call ? 0 : 1; pass < 2; pass++)
    {
      adjusted_args_size = args_size;

      if (pass)
        /* 提前处理参数是call_exp的情况 */
	      precompute_arguments (num_actuals, args);

      if (pass == 0) ...
      else if (adjusted_args_size.var != 0) ...
      else
        {
          poly_int64 needed = adjusted_args_size.constant;
          /* 更新outgoing区域的最大值 */
          crtl->outgoing_args_size = upper_bound (crtl->outgoing_args_size,
                                                  needed);
          if (must_preallocate)
            {
              if (ACCUMULATE_OUTGOING_ARGS)
                {
                  /* 栈参数地址 */
                  argblock = virtual_outgoing_args_rtx;
                }
            }
        }
      
      /* 根据栈参数的内存地址args[i].stack和stack_slot，
         在RISC-V小端模式下，arg的padding为PAD_UPWARD模式，因此stack和stack_slot一致。
         rtx如下:
           (mem (plus (reg virtual-outgoing-args)
                      (const_int args[i].locate.offset))) */
      compute_argument_addresses (args, argblock, num_actuals);

      /* expand寄存器参数tree */
      precompute_register_parameters (num_actuals, args, &reg_parm_seen);

      /* 将栈参数expand并emit存储到对应的stack位置的指令，rtx如下：
         (set (mem (plus (reg virtual-outgoing-args)
                         (const_int args[i].locate.offset)))
              args[i].value) */
      for (i = 0; i < num_actuals; i++)
        {
          if (args[i].reg == 0 || args[i].pass_on_stack)
            {
              store_one_arg (&args[i], argblock, flags,
                             adjusted_args_size.var != 0,
                             reg_parm_stack_space)
            }
        }

      /* partial参数的stack部分expand存储到stack中，reg部分存储到对应硬件寄存器 */
      if (reg_parm_seen)
        for (i = 0; i < num_actuals; i++)
          if (args[i].partial != 0 && ! args[i].pass_on_stack)
            {
              store_one_arg (&args[i], argblock, flags,
                             adjusted_args_size.var != 0,
                             reg_parm_stack_space)
            }

      /* 生成move指令将完全通过寄存器传递的参数存放到对应硬件寄存器，rtx如下：
         (set args[i].reg args[i].value) */
      load_register_parameters (args, num_actuals, &call_fusage, flags,
				                        pass == 0, &sibcall_failure);
    }
}
```

### 函数接收参数实现

#### 断言函数列表

- `use_register_for_decl` 是否将变量存放于寄存器。在-O0情况下，都存放在栈上。开启-O1+优化时，尽可能存放在伪寄存器中。在后面寄存器分配时确定哪些spill到栈上。
- `defer_stack_allocation` 是否延迟到最后展开栈变量。在-O0和-O1情况下，都是立即展开。开启-O2+优化时，会尽可能延迟展开，以便将一些可以覆盖的栈变量存放在同一个栈位置（coalesced）

#### 调用链

```txt
pass_expand::execute
  expand_used_vars // 展开函数局部变量
    for each SA.map->num_partitions
      expand_one_ssa_partition
    for each local decl
      expand_one_var
    expand_used_vars_for_block
    if stack_vars_num > 0
      expand_stack_vars
  expand_function_start // 展开函数参数和返回值
    assign_parms // 展开函数参数
      assign_parm_find_data_types
      assign_parm_find_entry_rtl
      assign_parm_is_stack_parm
        assign_parm_find_stack_rtl // 确定存放的栈位置
        assign_parm_adjust_entry_rtl // 调整entry_rtl，对于partial的情况需要将reg部分的内容生成store指令存储到指定的位置（即stack_rtl）
  for each basic block
    expand_gimple_basic_block // 展开每一个基本块
```


```c++
/* gcc/cfgexpand.cc */
unsigned int
pass_expand::execute (function *fun)
{
  ...

  /* 确定局部变量的栈位置或者寄存器位置 */
  start_sequence ();
  var_ret_seq = expand_used_vars (forced_stack_vars);
  var_seq = get_insns ();
  end_sequence ();

  ...

  /* 展开函数参数
     1. -O0的情况，将命名寄存器参数都存储到local stack中，由virtual-stack-vars+offset确定其栈位置，将匿名寄存器参数（不确定参数）存储到varargs区域，由virtual-incoming-args+offset确定其栈位置。刚好使其跟匿名栈参数连续地放在一起 */
  expand_function_start (current_function_decl);

  /* 以basic block为单位展开函数体，将gimple转化为rtx。
     在该过程中如果遇到对局部变量的引用或者修改，则根据前面确定的栈位置进行展开 */
  FOR_BB_BETWEEN (bb, init_block->next_bb, EXIT_BLOCK_PTR_FOR_FN (fun),
		  next_bb)
    bb = expand_gimple_basic_block (bb, var_ret_seq != NULL_RTX);
}

static rtx_insn *
expand_used_vars (bitmap forced_stack_vars)
{
  /* 1. */
  for (i = 0; i < SA.map->num_partitions; i++)
    {
      if (bitmap_bit_p (SA.partitions_for_parm_default_defs, i))
        continue;

      tree var = partition_to_var (SA.map, i);

      /* 尝试展开SSA对应的变量，即确定其rtx表达式
         -O0时，变量都存放在栈上
         -Ox时，能使用寄存器的局部变量都使用伪寄存器，然后交由寄存器分配pass确定哪些需要spill到栈上 */
      expand_one_ssa_partition (var);
    }

  /* 2. */
  FOR_EACH_LOCAL_DECL (cfun, i, var)
    {
      if (is_gimple_reg (var))
        {
          /* 早已展开 */
          TREE_USED (var) = 0;
          goto next;
        }
      else if (TREE_STATIC (var) || DECL_EXTERNAL (var))
	      expand_now = true;
      else if (TREE_USED (var))
	      expand_now = true;

      TREE_USED (var) = 1;

      if (expand_now)
        /* expand_one_var -> expand_one_stack_var -> expand_one_stack_var_1 */
        expand_one_var (var, true, true, forced_stack_vars);
    }

  /* 3. 逐层作用域展开还未展开的变量 */
  expand_used_vars_for_block (outer_block, true, forced_stack_vars);

  /* 4. 展开延迟的栈变量 */
  if (stack_vars_num > 0)
    {
      expand_stack_vars (NULL, &data);
    }
}

static void
expand_one_ssa_partition (tree var)
{
  ...
  if (!use_register_for_decl (var))
    {
      /* 变量必须存放在栈中 */
      if (defer_stack_allocation (var, true))
        /* 如果变量要延迟以便尝试进行栈复用（coalesced） */
	      add_stack_var (var, true);
      else
        /* 立即展开 */
	      expand_one_stack_var_1 (var);
      return;
    }
  
  /* 变量存放在寄存器 */
  machine_mode reg_mode = promote_ssa_mode (var, NULL);
  rtx x = gen_reg_rtx (reg_mode);

  set_rtl (var, x);
  ...
}

static void
expand_one_stack_var_1 (tree var)
{
  poly_uint64 size;
  poly_int64 offset;
  unsigned byte_align;

  if (TREE_CODE (var) == SSA_NAME)
    {
      tree type = TREE_TYPE (var);
      size = tree_to_poly_uint64 (TYPE_SIZE_UNIT (type));
    }
  else
    size = tree_to_poly_uint64 (DECL_SIZE_UNIT (var));

  byte_align = align_local_variable (var, true);

  rtx base;
  if (hwasan_sanitize_stack_p ())
    {
      ...
    }
  else
    {
      /* 给变量分配栈空间 */
      offset = alloc_stack_frame_space (size, byte_align);
      base = virtual_stack_vars_rtx;
    }

  expand_one_stack_var_at (var, base,
			   crtl->max_used_stack_slot_alignment, offset);
}
```

#### 函数栈帧各区域size的计算

- virtual-stack-vars -> frame register 局部变量指针
- virtual-incoming-args -> arg register 栈参数指针
- virtual-outgoing-args -> sp register 传参指针
- virtual-stack-dynamic -> sp register 栈内存动态分配

#### RISC-V后端处理部分

- 将虚拟寄存器转换为hard register
  - ELIMINABLE_REGS
  - TARGET_CAN_ELIMINATE (riscv_can_eliminate)
  - INITIAL_ELIMINATION_OFFSET (riscv_initial_elimination_offset)
  - TARGET_RETURN_IN_MEMORY
  - TARGET_PASS_BY_REFERENCE
  - TARGET_FUNCTION_ARG 确定caller如何传递参数
  - TARGET_FUNCTION_INCOMING_ARG 让callee知道参数怎么转进来，如果未定义则使用TARGET_FUNCTION_ARG
  - TARGET_ARG_PARTIAL_BYTES
  - ARGS_GROW_DOWNWARD 表示栈参数从上往下存储。RISC-V来说是从下往上存储，不能定义这个参数

GCC后端无关代码部分计算好各个区域的size后，会通过HOOK交由对应后端做处理。对于RISC-V后端来说，主要需要做的是根据这些栈帧信息生成prologue（序幕）和epilogue（尾声）代码。包括修改sp（栈指针）和fp（帧指针）、保存callee-saved寄存器。其中最复杂的是修改sp指针，涉及到如何选择偏移量从而生成尽可能少的指令（addi、add、sub）。代码主要涉及到[gcc/config/riscv/riscv.cc](https://github.com/gcc-mirror/gcc/blob/releases/gcc-12.1.0/gcc/config/riscv/riscv.cc)中的[riscv_compute_frame_info](https://github.com/gcc-mirror/gcc/blob/releases/gcc-12.1.0/gcc/config/riscv/riscv.cc#L3978)、[riscv_expand_prologue](https://github.com/gcc-mirror/gcc/blob/releases/gcc-12.1.0/gcc/config/riscv/riscv.cc#L4325)、[riscv_expand_epilogue](https://github.com/gcc-mirror/gcc/blob/releases/gcc-12.1.0/gcc/config/riscv/riscv.cc#L4428)三个函数。

### 参考

- [RISC-V Calling Conventions](https://github.com/riscv-non-isa/riscv-elf-psabi-doc/blob/master/riscv-cc.adoc)
- [AArch64函数栈的分配,指令生成与GCC实现(上)](https://blog.csdn.net/lidan113lidan/article/details/123961152)
- [AArch64函数栈的分配,指令生成与GCC实现(下)](https://blog.csdn.net/lidan113lidan/article/details/123961954)
- [GCC Stack Frames](http://stffrdhrn.github.io/software/embedded/openrisc/2018/06/08/gcc_stack_frames.html)
