# RISC-V中的寻址模式及链接器中的Relocation和Relaxation

本文介绍RISC-V中的寻址模式，包括跳转指令和LOAD/STORE指令的寻址模式。然后介绍链接器中静态链接时的Relocation和Relaxation，以及链接器对RISC-V中的寻址模式的使用。链接过程对最终代码生成会有影响，有时并不能只看汇编，尤其做Benchmark对比的时候需要考虑这块的影响。

## RISC-V中的寻址模式介绍

RV32I中直接跟地址相关的指令包括：

- 无条件跳转
  - `jal rd, imm20`
    - 含义：next_pc = current_pc + (imm20 << 1)
    - (imm20 << 1)的范围：-2^20 ~ 2^20-1（并且最低位恒为0）
    - 寻址范围 ±1 MiB 
  - `jalr rd, rs1, imm12`
    - 含义：next_pc = rs1 + imm12
    - imm12的范围: -2^11 ~ 2^11 - 1
    - 地址最后一位永远设置为0
- 有条件跳转指令（BRANCH）
  - `beq/bne/blt/bltu/bge/bgeu rs1, rs2, imm12`
    - 含义：next_pc = current_pc + (imm12 << 1)
    - (imm12 << 1)的范围: -2^12 ~ 2^12-1（并且最低位恒为0）
    - 寻址范围 ±4 KiB
- 内存访问指令（LOAD/STORE）
  - `lw/lh/lhu/lb/lbu/sw/sh/sb rs2, imm12(rs1)`
    - 含义：address = rs1 + imm12
    - imm12的范围: -2^11 ~ 2^11-1
    - 一般地址要求根据data size对齐

另外RV64I中新增的跟地址相关的指令包括`ld/sd`，跟RV32I中的LOAD/STORE类似。所以可以认为RISC-V包括两种寻址模式，一种是PC相关寻址（`jal`、BRANCH），一种是寄存器寻址（`jalr`、LOAD/STORE）。不过实际上寄存器寻址可以再分成PC和绝对地址两种，这是通过结合`auipc`和`lui`指令来实现，如下面的汇编所示。因此，RISC-V中实际上是支持PC相关和绝对地址两种寻址模式，其中`jal`和BRANCH指令只支持PC相关寻址，`jalr`和LOAD/STORE指令两种寻址模式都支持。

```asm
;; 跳转到PC相关的地址，基于当前PC做偏移
auipc t1, imm20
jalr t2, t1, imm12

;; 跳转到绝对地址，可以看做相对于0做偏移
lui t1, imm20
jalr t2, t1, imm12
```

`auipc`和`lui`指令介绍：

- `auipc rd, imm20`
  - 含义：rd = current_pc + (imm20 << 12)
  - (imm20 << 12)范围：-2^31 ~ 2^31-1（并且低12位恒为0）
  - 在RV64I中，(imm20 << 12)是32位数据，先将其符号扩展为64位再和current_pc相加。
- `lui rd, imm20`
  - 含义：rd = imm20 << 12
  - (imm20 << 12)范围：-2^31 ~ 2^31-1（并且低12位恒为0）
  - 在RV64I中，(imm20 << 12)是32位数据，先将其符号扩展为64位再存储到rd寄存器中

## 目标文件中的Relocation和Relaxation

Relocation（重定向）是指为位置相关代码和数据**分配实际地址并对应修改相关代码**的一个过程（[Wikipedia](https://en.wikipedia.org/wiki/Relocation_(computing))）。那么为什么需要Relocation呢？回答这个问题需要先来看下GCC是如何生成可执行文件的。GCC总共分成四个阶段来生成可执行文件（通过`--save-temps`可以看到每个阶段的输出）：

- 预处理阶段（`-E`）：输入.c文件，输出.i文件。只处理#开头的预处理指令，比如`#include`、`#ifdef`等
- 编译阶段（`-S`）：输入.i文件，输出.s文件。将C高级语言编译为机器语言（此时的机器语言使用汇编表示）
- 汇编阶段（`-c`）：输入.s文件，输出.o文件。将汇编表示的机器语言转成二进制格式
- 链接阶段：输入.o及其他依赖的库文件，输出可执行文件。这一步需要做的事情就是整理每个输入文件（ELF文件）中的各个段的信息，最终形成一个新的ELF文件。也只有到这一步，代码中的每一个符号的地址才被最终确定。

正是因为负责生成指令的编译阶段和负责确定各个符号地址的链接阶段是分开的。当一个.c文件使用到了另外一个.c文件中的某个变量时，在编译阶段是无法确定该变量的内存地址的，只有到链接阶段才能知道。因此需要有一个东西来串联起来，以便告知链接器编译出的哪些指令需要在链接的时候进行修正。这就是Relocation所要做的事情。通过Relocation表，链接器知道有哪些地址需要被修正，并在确定了所引用符号的最终地址后将其修正过来。而Relaxation表的作用在于提醒链接器，可以尝试优化指令以提高性能（比如减少不必要的指令）。能进行优化的前提是前面提到的RISC-V中提供的各种地址相关的各种指令，比如当地址不超过imm12范围时，可以删除不必要的`aupic`和`lui`指令。下面来详细介绍一下。

根据当前的RISC-V ABI规范，静态链接时存在30多种Relocations，本文主要介绍R_RISCV_HI20+R_RISCV_LO12_I/R_RISCV_LO12_S、R_RISCV_PCREL_HI20+R_RISCV_PCREL_LO12_I/R_RISCV_PCREL_LO12_S、R_RISCV_BRANCH、R_RISCV_CALL、R_RISCV_JAL这几种Relocations，并会使用实际的例子来展示。想了解更详细的有关Relocations的信息请移步[RISC-V ELF Specification](https://github.com/riscv-non-isa/riscv-elf-psabi-doc/blob/master/riscv-elf.adoc#relocations)。

影响Relocations生成的GCC编译器参数如下：

- `-mcmodel`：[Code Model](https://github.com/riscv-non-isa/riscv-elf-psabi-doc/blob/master/riscv-elf.adoc#code-models)
  - `medlow`：直接使用绝对值作为符号地址（RV32可以表示整个内存地址，RV64只能近似索引最低2GiB和最高2GiB）
  - `medany`：使用当前PC加偏移作为符号地址（地址范围为当前PC前后2GiB范围）
- `-mno-relax`：不让连接器做Relaxation优化（汇编中的`option norelax`也是同样的效果）
- `-march`：是否支持压缩扩展指令（C）会影响Relocations的选择（比如`-march=rv64g`和`-march=rv64gc`）
- `-fpic/-fPIC`、`-fpie/-fPIE`：生成位置无关代码（这里的位置是指程序被load的地址）

后面通过下面的示例代码来查看生成的Relocations：

- relocation.c

  ```c
  /* relocation.c */
  extern long global_var;
  long foo();

  long bar() 
  {
    long local_var = foo();
    if (local_var > global_var) {
      local_var -= 1;
    } else {
      local_var += 1;
    }
    return local_var;
  }
  ```

- main.c

  ```c
  /* main.c */
  long global_var;
  long bar();

  long foo() 
  {
    return 1;
  }

  void _start()
  {
    bar();
  }
  ```

### Relocation及其使用过程

命令：`riscv64-unknown-linux-gnu-gcc -march=rv64g -mcmodel=medlow -mno-relax -nostartfiles --save-temp -Wl,-q relocation.c main.c`

参数解释：

- `-mcmodel=medlow` 将Code Model设置为medlow
- `-nostartfiles` 表示不额外链接一些内置的库，目的是为了最终得到的可执行文件比较干净
- `--save-temp` 表示将中间结果保存下来，包括.i，.s，.o等文件
- `-Wl,-q` 表示链接的时候保留Relocation的信息，主要为了方便分析


使用上面的命令编译生成可执行文件，同时将中间文件保存下来。比如a-relocation.o就是relocation.c对应的目标文件，这里的前缀`a-`实际上是最终可执行文件的名称（`a.out`中的`a`）。

- a-relocation.o

  可以从下面a-relocation.o的dump信息看到出现了R_RISCV_CALL、R_RISCV_HI20+R_RISCV_LO12_I、R_RISCV_BRANCH、R_RISCV_JAL这几个Relocations。其中R_RISCV_BRANCH和R_RISCV_JAL这两个Relocations对应的符号的值已知，因此对应的指令的偏移已经设置好了，不需要等到链接阶段。比如0x38位置的`bge`指令的offset为0x14（根据S+A-P计算而来，即0x4c-0x38.其中S表示`.L2`符号的值，即Relocation段中的`Sym. Value`，为0x4c；A表示额外加的常数，这里为0；P表示指令`bge`在.text段中的偏移，即Relocation段中的`Offset`，为0x38）。

  而R_RISCV_CALL、R_RISCV_HI20+R_RISCV_LO12_I这需要等到链接的时候才能确定`foo`和`global_var`符号的值。可以从下面的a.out的dump信息中进行验证。

  ```
  # riscv64-unknown-linux-gnu-readelf -s -r a-relocation.o

  Relocation section '.rela.text' at offset 0x230 contains 5 entries:
    Offset          Info           Type           Sym. Value    Sym. Name + Addend
  000000000020  000a00000012 R_RISCV_CALL      0000000000000000 foo + 0
  00000000002c  000b0000001a R_RISCV_HI20      0000000000000000 global_var + 0
  000000000030  000b0000001b R_RISCV_LO12_I    0000000000000000 global_var + 0
  000000000038  000600000010 R_RISCV_BRANCH    000000000000004c .L2 + 0
  000000000048  000700000011 R_RISCV_JAL       0000000000000058 .L3 + 0

  Symbol table '.symtab' contains 12 entries:
    Num:    Value          Size Type    Bind   Vis      Ndx Name
      0: 0000000000000000     0 NOTYPE  LOCAL  DEFAULT  UND
      1: 0000000000000000     0 FILE    LOCAL  DEFAULT  ABS relocation.c
      2: 0000000000000000     0 SECTION LOCAL  DEFAULT    1 .text
      3: 0000000000000000     0 SECTION LOCAL  DEFAULT    3 .data
      4: 0000000000000000     0 SECTION LOCAL  DEFAULT    4 .bss
      5: 0000000000000000     0 SECTION LOCAL  DEFAULT    6 .note.GNU-stack
      6: 000000000000004c     0 NOTYPE  LOCAL  DEFAULT    1 .L2
      7: 0000000000000058     0 NOTYPE  LOCAL  DEFAULT    1 .L3
      8: 0000000000000000     0 SECTION LOCAL  DEFAULT    5 .comment
      9: 0000000000000000   128 FUNC    GLOBAL DEFAULT    1 bar
     10: 0000000000000000     0 NOTYPE  GLOBAL DEFAULT  UND foo
     11: 0000000000000000     0 NOTYPE  GLOBAL DEFAULT  UND global_var
  ```
  ```
  # riscv64-unknown-linux-gnu-objdump -d -r -Mno-aliases a-relocation.o

  a-relocation.o:     file format elf64-littleriscv


  Disassembly of section .text:

  0000000000000000 <bar>:
    0:   81010113                addi    sp,sp,-2032
    4:   7e113423                sd      ra,2024(sp)
    8:   7e813023                sd      s0,2016(sp)
    c:   7f010413                addi    s0,sp,2032
    10:   fff00293                li      t0,-1
    14:   02029293                slli    t0,t0,0x20
    18:   7f028293                addi    t0,t0,2032
    1c:   00510133                add     sp,sp,t0
    20:   00000097                auipc   ra,0x0
                          20: R_RISCV_CALL        foo
    24:   000080e7                jalr    ra # 20 <bar+0x20>
    28:   fea43423                sd      a0,-24(s0)
    2c:   000007b7                lui     a5,0x0
                          2c: R_RISCV_HI20        global_var
    30:   0007b783                ld      a5,0(a5) # 0 <bar>
                          30: R_RISCV_LO12_I      global_var
    34:   fe843703                ld      a4,-24(s0)
    38:   00e7da63                bge     a5,a4,4c <.L2>
                          38: R_RISCV_BRANCH      .L2
    3c:   fe843783                ld      a5,-24(s0)
    40:   fff78793                addi    a5,a5,-1
    44:   fef43423                sd      a5,-24(s0)
    48:   0100006f                j       58 <.L3>
                          48: R_RISCV_JAL .L3

  000000000000004c <.L2>:
    4c:   fe843783                ld      a5,-24(s0)
    50:   00178793                addi    a5,a5,1
    54:   fef43423                sd      a5,-24(s0)

  0000000000000058 <.L3>:
    58:   fe843783                ld      a5,-24(s0)
    5c:   00078513                mv      a0,a5
    60:   00100293                li      t0,1
    64:   02029293                slli    t0,t0,0x20
    68:   81028293                addi    t0,t0,-2032
    6c:   00510133                add     sp,sp,t0
    70:   7e813083                ld      ra,2024(sp)
    74:   7e013403                ld      s0,2016(sp)
    78:   7f010113                addi    sp,sp,2032
    7c:   00008067                ret
  ```

- a.out

  从下面a.out的dump信息可以看到这时候的`foo`和`global_var`符号的值已经确定，分别是0x10168和0x111b8。其中R_RISCV_CALL对应指令的偏移为0x60（根据S+A-P计算而得，即0x10168-0x10108。其中S表示`foo`符号的值，为0x10168；A为0；P表示需要所在指令的偏移，即Relocation段中的`Offset`，为0x10108。注意P所在的指令是`auipc`，而不是`jalr`）。不过因为RISC-V中的跳转指令的范围很小（最大的jal指令的范围为±1 MiB），而编译的时候也无法知道该符号的值是否能在jal指令的范围，因此生成了auipc+jalr的保守组合。因此需要将计算出的偏移量0x60根据规则放到这两条指令中去。因为这个例子计算出的偏移量为0x60，实际上一条jal指令就可以搞定，因此auipc指令的值实际上是0，也因此auipc+jalr指令组合可以被替换成jal单条指令。这是Relaxation做的事情，后面再介绍。
  
  R_RISCV_HI20+R_RISCV_LO12_I的计算方式为S+A，因为对应的指令是使用绝对值，跟指令的PC无关。其他的类似，因此不再赘述。

  ```
  # riscv64-unknown-linux-gnu-readelf -s -r a.out

  Relocation section '.rela.text' at offset 0x460 contains 6 entries:
    Offset          Info           Type           Sym. Value    Sym. Name + Addend
  000000010108  001000000012 R_RISCV_CALL      0000000000010168 foo + 0
  000000010114  000b0000001a R_RISCV_HI20      00000000000111b8 global_var + 0
  000000010118  000b0000001b R_RISCV_LO12_I    00000000000111b8 global_var + 0
  000000010120  000700000010 R_RISCV_BRANCH    0000000000010134 .L2 + 0
  000000010130  000800000011 R_RISCV_JAL       0000000000010140 .L3 + 0
  000000010198  001400000012 R_RISCV_CALL      00000000000100e8 bar + 0

  Symbol table '.symtab' contains 21 entries:
    Num:    Value          Size Type    Bind   Vis      Ndx Name
      0: 0000000000000000     0 NOTYPE  LOCAL  DEFAULT  UND
      1: 00000000000100e8     0 SECTION LOCAL  DEFAULT    1 .text
      2: 00000000000111b8     0 SECTION LOCAL  DEFAULT    3 .data
      3: 00000000000111b8     0 SECTION LOCAL  DEFAULT    4 .sdata
      4: 00000000000111c0     0 SECTION LOCAL  DEFAULT    5 .bss
      5: 0000000000000000     0 SECTION LOCAL  DEFAULT    6 .comment
      6: 0000000000000000     0 FILE    LOCAL  DEFAULT  ABS relocation.c
      7: 0000000000010134     0 NOTYPE  LOCAL  DEFAULT    1 .L2
      8: 0000000000010140     0 NOTYPE  LOCAL  DEFAULT    1 .L3
      9: 0000000000000000     0 FILE    LOCAL  DEFAULT  ABS main.c
     10: 00000000000119b8     0 NOTYPE  GLOBAL DEFAULT  ABS __global_pointer$
     11: 00000000000111b8     8 OBJECT  GLOBAL DEFAULT    4 global_var
     12: 00000000000111b8     0 NOTYPE  GLOBAL DEFAULT    4 __SDATA_BEGIN__
     13: 0000000000010188    48 FUNC    GLOBAL DEFAULT    1 _start
     14: 00000000000111c0     0 NOTYPE  GLOBAL DEFAULT    5 __BSS_END__
     15: 00000000000111c0     0 NOTYPE  GLOBAL DEFAULT    5 __bss_start
     16: 0000000000010168    32 FUNC    GLOBAL DEFAULT    1 foo
     17: 00000000000111b8     0 NOTYPE  GLOBAL DEFAULT    3 __DATA_BEGIN__
     18: 00000000000111c0     0 NOTYPE  GLOBAL DEFAULT    4 _edata
     19: 00000000000111c0     0 NOTYPE  GLOBAL DEFAULT    5 _end
     20: 00000000000100e8   128 FUNC    GLOBAL DEFAULT    1 bar
  ```

  ```
  # riscv64-unknown-linux-gnu-objdump -d -r -Mno-aliases a.out

  a.out:     file format elf64-littleriscv


  Disassembly of section .text:

  00000000000100e8 <bar>:
    100e8:       81010113                addi    sp,sp,-2032
    100ec:       7e113423                sd      ra,2024(sp)
    100f0:       7e813023                sd      s0,2016(sp)
    100f4:       7f010413                addi    s0,sp,2032
    100f8:       fff00293                li      t0,-1
    100fc:       02029293                slli    t0,t0,0x20
    10100:       7f028293                addi    t0,t0,2032
    10104:       00510133                add     sp,sp,t0
    10108:       00000097                auipc   ra,0x0
                          10108: R_RISCV_CALL     foo
    1010c:       060080e7                jalr    96(ra) # 10168 <foo>
    10110:       fea43423                sd      a0,-24(s0)
    10114:       000117b7                lui     a5,0x11
                          10114: R_RISCV_HI20     global_var
    10118:       1b87b783                ld      a5,440(a5) # 111b8 <global_var>
                          10118: R_RISCV_LO12_I   global_var
    1011c:       fe843703                ld      a4,-24(s0)
    10120:       00e7da63                bge     a5,a4,10134 <.L2>
                          10120: R_RISCV_BRANCH   .L2
    10124:       fe843783                ld      a5,-24(s0)
    10128:       fff78793                addi    a5,a5,-1
    1012c:       fef43423                sd      a5,-24(s0)
    10130:       0100006f                j       10140 <.L3>
                          10130: R_RISCV_JAL      .L3

  0000000000010134 <.L2>:
    10134:       fe843783                ld      a5,-24(s0)
    10138:       00178793                addi    a5,a5,1
    1013c:       fef43423                sd      a5,-24(s0)

  0000000000010140 <.L3>:
    10140:       fe843783                ld      a5,-24(s0)
    10144:       00078513                mv      a0,a5
    10148:       00100293                li      t0,1
    1014c:       02029293                slli    t0,t0,0x20
    10150:       81028293                addi    t0,t0,-2032
    10154:       00510133                add     sp,sp,t0
    10158:       7e813083                ld      ra,2024(sp)
    1015c:       7e013403                ld      s0,2016(sp)
    10160:       7f010113                addi    sp,sp,2032
    10164:       00008067                ret

  0000000000010168 <foo>:
    10168:       ff010113                addi    sp,sp,-16
    1016c:       00813423                sd      s0,8(sp)
    10170:       01010413                addi    s0,sp,16
    10174:       00100793                li      a5,1
    10178:       00078513                mv      a0,a5
    1017c:       00813403                ld      s0,8(sp)
    10180:       01010113                addi    sp,sp,16
    10184:       00008067                ret

  0000000000010188 <_start>:
    10188:       ff010113                addi    sp,sp,-16
    1018c:       00113423                sd      ra,8(sp)
    10190:       00813023                sd      s0,0(sp)
    10194:       01010413                addi    s0,sp,16
    10198:       00000097                auipc   ra,0x0
                          10198: R_RISCV_CALL     bar
    1019c:       f50080e7                jalr    -176(ra) # 100e8 <bar>
    101a0:       00000013                nop
    101a4:       00078513                mv      a0,a5
    101a8:       00813083                ld      ra,8(sp)
    101ac:       00013403                ld      s0,0(sp)
    101b0:       01010113                addi    sp,sp,16
    101b4:       00008067                ret
  ```

medlow对地址有限制，如果加上参数`-Wl,-Ttext-segment,0x80000000`，会导致报错（`riscv64-unknown-linux-gnu-gcc -march=rv64g -mcmodel=medlow -mno-relax -nostartfiles --save-temp -Wl,-q relocation.c main.c -Wl,-Ttext-segment,0x80000000`）：

```
a-relocation.o: in function `bar':
relocation.c:(.text+0x2c): relocation truncated to fit: R_RISCV_HI20 against symbol `global_var' defined in .sdata section in a-main.o
collect2: error: ld returned 1 exit status
```

报错的意思是说global_var符号的值超过了R_RISCV_HI20+R_RISCV_LO12_I能表示的范围了，会被截断。这时就需要使用medany 的Code Model了。即将`-cmodel=medlow`改为`-cmodel=medany`。下面来看下medany对Relocation的影响。

命令：`riscv64-unknown-linux-gnu-gcc -march=rv64g -mcmodel=medany -mno-relax -nostartfiles --save-temp -Wl,-q relocation.c main.c`

这里重点看`-mcmodel=medany` 跟 `-mcmodel=medlow` 对Relocation计算的区别，这里主要的原因是寻址范围不同。

- a-relocation.o

  从下面a-relocation.o的dump信息来看，Code Model为medlow时的R_RISCV_HI20+R_RISCV_LO12_I组合变成了R_RISCV_PCREL_HI20+R_RISCV_PCREL_LO12_I的组合。R_RISCV_PCREL_HI20+R_RISCV_PCREL_LO12_I这两个组合的偏移计算方式为S+A-P，跟指令的PC值有关系，因此其寻址范围是指令PC的±2 GiB。而R_RISCV_HI20+R_RISCV_LO12_I的寻址范围为-2 GiB ~ 2 GiB。在RV32下面因为最大寻址空间就是4 GiB，两者的差距不大。

  ```
  riscv64-unknown-linux-gnu-readelf -s -r a-relocation.o

  Relocation section '.rela.text' at offset 0x248 contains 5 entries:
    Offset          Info           Type           Sym. Value    Sym. Name + Addend
  000000000020  000b00000012 R_RISCV_CALL      0000000000000000 foo + 0
  00000000002c  000c00000017 R_RISCV_PCREL_HI2 0000000000000000 global_var + 0
  000000000030  000600000018 R_RISCV_PCREL_LO1 000000000000002c .L0  + 0
  00000000003c  000700000010 R_RISCV_BRANCH    0000000000000050 .L2 + 0
  00000000004c  000800000011 R_RISCV_JAL       000000000000005c .L3 + 0

  Symbol table '.symtab' contains 13 entries:
    Num:    Value          Size Type    Bind   Vis      Ndx Name
      0: 0000000000000000     0 NOTYPE  LOCAL  DEFAULT  UND
      1: 0000000000000000     0 FILE    LOCAL  DEFAULT  ABS relocation.c
      2: 0000000000000000     0 SECTION LOCAL  DEFAULT    1 .text
      3: 0000000000000000     0 SECTION LOCAL  DEFAULT    3 .data
      4: 0000000000000000     0 SECTION LOCAL  DEFAULT    4 .bss
      5: 0000000000000000     0 SECTION LOCAL  DEFAULT    6 .note.GNU-stack
      6: 000000000000002c     0 NOTYPE  LOCAL  DEFAULT    1 .L0
      7: 0000000000000050     0 NOTYPE  LOCAL  DEFAULT    1 .L2
      8: 000000000000005c     0 NOTYPE  LOCAL  DEFAULT    1 .L3
      9: 0000000000000000     0 SECTION LOCAL  DEFAULT    5 .comment
     10: 0000000000000000   132 FUNC    GLOBAL DEFAULT    1 bar
     11: 0000000000000000     0 NOTYPE  GLOBAL DEFAULT  UND foo
     12: 0000000000000000     0 NOTYPE  GLOBAL DEFAULT  UND global_var
  ```

  ```
  # riscv64-unknown-linux-gnu-objdump -d -r -Mno-aliases a-relocation.o

  a-relocation.o:     file format elf64-littleriscv


  Disassembly of section .text:

  0000000000000000 <bar>:
    0:   81010113                addi    sp,sp,-2032
    4:   7e113423                sd      ra,2024(sp)
    8:   7e813023                sd      s0,2016(sp)
    c:   7f010413                addi    s0,sp,2032
    10:   fff00293                addi    t0,zero,-1
    14:   02029293                slli    t0,t0,0x20
    18:   7f028293                addi    t0,t0,2032
    1c:   00510133                add     sp,sp,t0
    20:   00000097                auipc   ra,0x0
                          20: R_RISCV_CALL        foo
    24:   000080e7                jalr    ra,0(ra) # 20 <bar+0x20>
    28:   fea43423                sd      a0,-24(s0)
    2c:   00000797                auipc   a5,0x0
                          2c: R_RISCV_PCREL_HI20  global_var
    30:   00078793                addi    a5,a5,0 # 2c <bar+0x2c>
                          30: R_RISCV_PCREL_LO12_I        .L0
    34:   0007b783                ld      a5,0(a5)
    38:   fe843703                ld      a4,-24(s0)
    3c:   00e7da63                bge     a5,a4,50 <.L2>
                          3c: R_RISCV_BRANCH      .L2
    40:   fe843783                ld      a5,-24(s0)
    44:   fff78793                addi    a5,a5,-1
    48:   fef43423                sd      a5,-24(s0)
    4c:   0100006f                jal     zero,5c <.L3>
                          4c: R_RISCV_JAL .L3

  0000000000000050 <.L2>:
    50:   fe843783                ld      a5,-24(s0)
    54:   00178793                addi    a5,a5,1
    58:   fef43423                sd      a5,-24(s0)

  000000000000005c <.L3>:
    5c:   fe843783                ld      a5,-24(s0)
    60:   00078513                addi    a0,a5,0
    64:   00100293                addi    t0,zero,1
    68:   02029293                slli    t0,t0,0x20
    6c:   81028293                addi    t0,t0,-2032
    70:   00510133                add     sp,sp,t0
    74:   7e813083                ld      ra,2024(sp)
    78:   7e013403                ld      s0,2016(sp)
    7c:   7f010113                addi    sp,sp,2032
    80:   00008067                jalr    zero,0(ra)

  ```

### Relaxation及其使用过程

从前面的例子会发现，不管是哪种Code Model，有些Relocation可以转换成指令更少的Relocation，比如将 R_RISCV_CALL 转换成 R_RISCV_JAL。为了指导链接器做相应的优化，需要带上Relaxation标记，也就是 R_RISCV_RELAX 类型的Relocation。这种标记不能单独存在，需要跟在正常的Relocation后面。

将之前的命令去掉`-mno-relax`参数：`riscv64-unknown-linux-gnu-gcc -march=rv64g -mcmodel=medlow -nostartfiles --save-temp -Wl,-q relocation.c main.c`

然后dump a-relocation.o文件会发现 R_RISCV_CALL 和 R_RISCV_HI20+R_RISCV_LO12_I 下面都带上了 R_RISCV_RELAX 。进一步dump a.out会发现 R_RISCV_CALL 被替换成了 R_RISCV_JAL。而 R_RISCV_HI20+R_RISCV_LO12_I 对应的符号因为范围超过了imm12表示的范围，所以没有被优化。

```
# riscv64-unknown-linux-gnu-objdump -d -r -Mno-aliases a-relocation.o

...
  20:   00000097                auipc   ra,0x0
                        20: R_RISCV_CALL        foo
                        20: R_RISCV_RELAX       *ABS*
  24:   000080e7                jalr    ra,0(ra) # 20 <bar+0x20>
  28:   fea43423                sd      a0,-24(s0)
  2c:   000007b7                lui     a5,0x0
                        2c: R_RISCV_HI20        global_var
                        2c: R_RISCV_RELAX       *ABS*
  30:   0007b783                ld      a5,0(a5) # 0 <bar>
                        30: R_RISCV_LO12_I      global_var
                        30: R_RISCV_RELAX       *ABS*
  34:   fe843703                ld      a4,-24(s0)
...
```

```
# riscv64-unknown-linux-gnu-objdump -d -r -Mno-aliases a.out

...
   102a0:       05c000ef                jal     ra,102fc <foo>
                        102a0: R_RISCV_JAL      foo
                        102a0: R_RISCV_RELAX    *ABS*
   102a4:       fea43423                sd      a0,-24(s0)
   102a8:       000127b7                lui     a5,0x12
                        102a8: R_RISCV_HI20     global_var
                        102a8: R_RISCV_RELAX    *ABS*
   102ac:       0087b783                ld      a5,8(a5) # 12008 <global_var>
                        102ac: R_RISCV_LO12_I   global_var
                        102ac: R_RISCV_RELAX    *ABS*
   102b0:       fe843703                ld      a4,-24(s0)
...
```

R_RISCV_CALL 的 Relaxation 过程可以从binutils的源码中看到，源代码中的注释说的很清楚，如下所示。

根据跳转的范围，R_RISCV_CALL 总共有三种 Relaxation 路径：

- 如果立即数的范围为 VALID_CJTYPE_IMM 并且支持压缩指令集C扩展，则将其优化成 `c.j` 或者 `c.jal`
- 如果立即数的范围为 VALID_JTYPE_IMM，则优化成 `jal`
- 如果立即数的范围为 imm12，则优化成 `jalr imm12(x0)`
- 其它情况下，不进行 Relaxation

```c
/* 源代码在线地址：https://github.com/bminor/binutils-gdb/blob/4ed07377e47addf4dd0594ac5b16d7e4cdb19436/bfd/elfnn-riscv.c#L4171 */

/* Relax AUIPC + JALR into JAL.  */

static bool
_bfd_riscv_relax_call (bfd *abfd, asection *sec, asection *sym_sec,
		       struct bfd_link_info *link_info,
		       Elf_Internal_Rela *rel,
		       bfd_vma symval,
		       bfd_vma max_alignment,
		       bfd_vma reserve_size ATTRIBUTE_UNUSED,
		       bool *again,
		       riscv_pcgp_relocs *pcgp_relocs,
		       bool undefined_weak ATTRIBUTE_UNUSED)
{
  bfd_byte *contents = elf_section_data (sec)->this_hdr.contents;
  bfd_vma foff = symval - (sec_addr (sec) + rel->r_offset);
  bool near_zero = (symval + RISCV_IMM_REACH / 2) < RISCV_IMM_REACH;
  bfd_vma auipc, jalr;
  int rd, r_type, len = 4, rvc = elf_elfheader (abfd)->e_flags & EF_RISCV_RVC;

  /* If the call crosses section boundaries, an alignment directive could
     cause the PC-relative offset to later increase, so we need to add in the
     max alignment of any section inclusive from the call to the target.
     Otherwise, we only need to use the alignment of the current section.  */
  if (VALID_JTYPE_IMM (foff))
    {
      if (sym_sec->output_section == sec->output_section
	  && sym_sec->output_section != bfd_abs_section_ptr)
	max_alignment = (bfd_vma) 1 << sym_sec->output_section->alignment_power;
      foff += ((bfd_signed_vma) foff < 0 ? -max_alignment : max_alignment);
    }

  /* See if this function call can be shortened.  */
  if (!VALID_JTYPE_IMM (foff) && !(!bfd_link_pic (link_info) && near_zero))
    return true;

  /* Shorten the function call.  */
  BFD_ASSERT (rel->r_offset + 8 <= sec->size);

  auipc = bfd_getl32 (contents + rel->r_offset);
  jalr = bfd_getl32 (contents + rel->r_offset + 4);
  rd = (jalr >> OP_SH_RD) & OP_MASK_RD;
  rvc = rvc && VALID_CJTYPE_IMM (foff);

  /* C.J exists on RV32 and RV64, but C.JAL is RV32-only.  */
  rvc = rvc && (rd == 0 || (rd == X_RA && ARCH_SIZE == 32));

  if (rvc)
    {
      /* Relax to C.J[AL] rd, addr.  */
      r_type = R_RISCV_RVC_JUMP;
      auipc = rd == 0 ? MATCH_C_J : MATCH_C_JAL;
      len = 2;
    }
  else if (VALID_JTYPE_IMM (foff))
    {
      /* Relax to JAL rd, addr.  */
      r_type = R_RISCV_JAL;
      auipc = MATCH_JAL | (rd << OP_SH_RD);
    }
  else
    {
      /* Near zero, relax to JALR rd, x0, addr.  */
      r_type = R_RISCV_LO12_I;
      auipc = MATCH_JALR | (rd << OP_SH_RD);
    }

  /* Replace the R_RISCV_CALL reloc.  */
  rel->r_info = ELFNN_R_INFO (ELFNN_R_SYM (rel->r_info), r_type);
  /* Replace the AUIPC.  */
  riscv_put_insn (8 * len, auipc, contents + rel->r_offset);

  /* Delete unnecessary JALR.  */
  *again = true;
  return riscv_relax_delete_bytes (abfd, sec, rel->r_offset + len, 8 - len,
				   link_info, pcgp_relocs);
}
```

## 总结

Relocation的存在是因为编译和链接过程是分开进行的，需要有一个机制在两者之间进行信息传递（也就是在ELF中包含Relocation段）。Relaxation的存在是跟RISC-V的指令集架构有关系，正式因为RISC-V寻址范围受限，才有必要通过Relaxation来显式的告诉链接器主动减少不必要的指令，从而优化程序的性能和Code Size。

## 参考

- [RISC-V ELF Specification](https://github.com/riscv-non-isa/riscv-elf-psabi-doc/blob/master/riscv-elf.adoc)
- [All Aboard, Part 2: Relocations in ELF Toolchains](https://www.sifive.com/blog/all-aboard-part-2-relocations)
- [All Aboard, Part 3: Linker Relaxation in the RISC-V Toolchain](https://www.sifive.com/blog/all-aboard-part-3-linker-relaxation-in-riscv-toolchain)
- [All Aboard, Part 4: The RISC-V Code Models](https://www.sifive.com/blog/all-aboard-part-4-risc-v-code-models)
- [The dark side of RISC-V linker relaxation](https://maskray.me/blog/2021-03-14-the-dark-side-of-riscv-linker-relaxation)
- [ELF Binaries and Relocation Entries](http://stffrdhrn.github.io/hardware/embedded/openrisc/2019/11/29/relocs.html)
