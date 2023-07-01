# 软硬件接口之内存模型及RISC-V内存模型介绍

本文介绍软硬件接口中的内存模型接口，包括内存模型的概念及常见的几种内存模型，然后介绍RISC-V指令架构中的内存模型。其中的例子大部分来自于参考资料。

术语

- shared memory 指处理器之间共享的内存组件
- program order 指指令在所运行程序中的先后顺序
- global memory order 指相对shared memory来说的各个线程访问内存的顺序
- preserved program order 指线程中指令的global memory order和program order一致的那部分指令的order

## 内存模型简介

内存模型（memory model or memory consistency model）是一种软件与硬件之间的接口，包含一系列的规则。**这些规则规定了在多线程程序（多个独立的执行体，多线程）的运行过程中，共享内存访问指令（LOAD和STORE）的行为，或者说规定LOAD指令可以返回哪些值**。这些规则越宽松（也就是说运行时的可能顺序越多），允许的处理器优化就越多，同时在该模型上编程就越复杂。如何在这两者之间选择一个平衡点是关键。经过多年发展，业界提出了多个内存模型。本文主要介绍几种在工业界使用的内存模型，包括sequential consistency model（SC）、total store ordering model（TSO）和release consistency model（RC）。这三种内存模型，规则越来越宽松。其中x86-64处理器实现的是STO内存模型，RISC-V则提供STO和RC两种内存模型选择。

### Sequential Consistency Model

直观上来看，多线程程序中的共享内存访问指令应该是排他地访问shared memory，在完成之前其他访问指令将被阻塞。因此从shared memory的角度来看，它并不需要知道有多个线程在同时执行。多个线程中的所有共享内存访问指令最终是以某种先后顺序（全局内存访问顺序，global memory order）访问shared memory。然后具体到一个线程中的内存访问指令，这些指令在global memory order中的先后顺序跟它在程序中的先后顺序（program order）一致。这也是sequential consistency model规定的行为。

在SC内存模型下，并行程序相比于串行程序，因为每个线程被调度的时机是不确定的，会存在多个可能的global memory order。**并行程序执行的结果就像是每次从所有未结束的线程中随机选择一个并执行其当前指令，直到所有线程的指令都执行完**。因此在这个模型中，每个线程中的指令被处理器执行的先后顺序跟指令的program order一致。比如下面这个例子，有以下6种可能的global memory order（例子中的x、y、z为内存变量，r1、r2、r3等为寄存器变量，并假设这些变量的初始值为0，后面的示例都采用类似约定）。

```
// Thread 1  |  // Thread 2  |  // Thread 3
x = 1        |  x = 2        |  x = 3
```

可能的global memory order：

```
// Order1  |  // Order 2  |  // Order 3  |  // Order 4  |  // Order 5  |  // Order 6
x = 1      |  x = 1       |  x = 2       |  x = 2       |  x = 3       |  x = 3
x = 2      |  x = 3       |  x = 1       |  x = 3       |  x = 1       |  x = 2
x = 3      |  x = 2       |  x = 3       |  x = 1       |  x = 2       |  x = 1
```

因此所有线程执行完成之后，最终内存x的值可能为1、2、3，这些情况在SC内存模型下面都是合理的。

在SC内存模型下，假如线程之间需要交互，比如Thread 1需要等待Thread 2的某个操作之后才能往下执行，这可以通过检查某个内存flag来做判断，比如下面的代码：

```
// Thread 1      |  // Thread 2
check:           |  x = 1
  if (x == 0)    |
    goto check   |
  y = x + 2      |
```

保证内存y的值为修改后的内存x的值加上2。

这种交互是多线程相比单线程天然增加的一种情况，跟用哪种内存模型没有关系。而比SC更弱的内存模型，因为共享内存指令执行的实际顺序可能跟program order不一致，还需要考虑这种不一致的情况是否会导致程序运行不符合预期。如果可能会出问题，则需要加入更多的顺序控制指令以保证程序的实际顺序不会出现不符合预期的情况。

### Total Store Ordering Model

假如将SC内存模型中的一些指令的顺序放宽，比如允许改变program order中的STORE -> LOAD的顺序（STORE和LOAD都处于同一个线程）。这种模型叫做total store ordering model，是x86处理器实现的内存模型。跟SC相比，program order中的STORE -> LOAD（先STORE后LOAD）这种顺序可以改变，其余的组合（LOAD -> LOAD，LOAD -> STORE，STORE -> STORE）和SC内存模型一样必须保持program order。需要注意的是，这里说的LOAD与STORE之间的顺序是相对shared memory组件来说的。比如这里的STORE -> LOAD顺序可以改变是说LOAD可以先读取shared memory，STORE后写入shared memory。但是假如LOAD的内存地址和STORE的内存地址一样，则优先返回STORE的值（即使该STORE还没有写入shared memory），而不是从shared memory中读取，这是为了保证程序的语义。否则有可能出现读到之前该线程STORE的值。

从实现角度上来理解，可以认为每个处理器有一个私有的write queue，执行STORE时先放入write queue，然后继续执行后面的指令。等到时机成熟再将write queue中的STOREs按照先进先出的顺序批量写入shared memory。这里也可以看成STORE操作不再是原子操作，而是分成了两步操作。首先是写入write queue（STORE1），这时仅对自己线程的LOAD指令可见。然后写入shared memory（STORE2），对其他线程的LOAD指令可见。

下面例子展示了TSO相比SC允许的情况：

```
// Thread 1  |  // Thread 2
x = 1        |  y = 1
r1 = y       |  r2 = x
```

问题：程序执行完之后，r1和r2可能都为0吗？

- SC内存模型：不能（r1和r2中至少有一个为1）
- TSO内存模型：可能

比如下面这种运行情况就可以得到该结果：

1. 执行`x = 1`修改内存x的值，先将STORE操作放入write queue（STORE1_x）
2. 执行`r1 = y`，从shared memory读取内存y的值为0（LOAD_y）
3. 执行`y = 1`修改shared memory中内存y的值为1（STORE1_y、STORE2_y）
4. 执行`r2 = x`，从shared memory读取内存x的值为0（此时`x = 1`的写入操作还在write queue中）（LOAD_x）
5. 执行Thread 1中的write queue，修改shared memory中内存x的值为1（STORE2_x）

这时就需要引入新的内存控制指令（比如fence内存屏障指令），以便让用户告知CPU强制执行write queue中的STOREs指令。比如下面的例子，使用fence内存屏障指令（比如x86中的mfence）强制在该指令之前执行write queue中的STOREs操作，从而保证Thread 3能够结束（也就是说Thread 1和Thread 2执行完之后，内存a和b中的值不会同时为0）：

```
// Thread 1  |  // Thread 2  |  // Thread 3
x = 1        |  y = 1        |  wait:
fence        |  fence        |    if (a == 0 && b == 0)
a = y        |  b = x        |      goto wait
```

### Release Consistency Model

如果再进一步看多线程程序，除了因为前后依赖导致的program order不能改变之外，大部分情况下program order的改变都不会影响最终的结果。因此，可以将共享内存访问指令分为两类，普通共享内存访问指令和同步共享内存访问指令。普通共享内存访问指令之间的顺序允许改变（在保证程序语义的情况下），同步共享内存访问指令用于在需要控制顺序的情况下。比如存在数据竞争（data race）的程序中，通过使用该类指令强制某种顺序，从而消除数据竞争。下面一些例子展示了RC内存模型下，普通共享内存访问指令允许更多的可能。

比如下面这个例子展示了RC内存模型允许STORE -> STORE的global memory order的修改：

```
// Thread 1  |  // Thread 2
x = 1        |  r1 = y
y = 1        |  r2 = x
```

问题：假设x和y为不同内存地址，程序执行完之后，r1 = 1，r2 = 0？

- SC内存模型：不能
- TSO内存模型：不能
- RC内存模型：可能（`x = 1`和`y = 1`执行时允许调换顺序）

为了保证不出现这种情况，可以在`x = 1`和`y = 1`之间插入一条fence指令告诉处理器，前面的共享内存访问指令必须在fence指令之前被执行，后面的内存访问指令不能先于fence指令被执行：

```
// Thread 1  |  // Thread 2
x = 1        |  r1 = y
fence        |  r2 = x
y = 1        |
```

下面例子展示了RC内存模型中不同线程看到的global memory order可以不一样：

```
// Thread 1  |  // Thread 2  |  // Thread 3  |  // Thread 4
x = 1        |  y = 1        |  r1 = x       |  r3 = y
             |               |  r2 = y       |  r4 = x
```

问题：程序执行完之后，r1 = 1, r2 = 0, r3 = 1, r4 = 0?

- SC内存模型：不能
- TSO内存模型：不能
- RC内存模型：可能

比如下面这种运行情况就可以得到该结果：

1. 执行`x = 1`修改内存x的值，随后Thread 3观察到，但Thread 4还没有观察到
2. 执行`y = 1`修改内存x的值，随后Thread 4观察到，但Thread 3还没有观察到
3. 执行`r1 = x`获取内存x的值为1
4. 执行`r3 = y`获取内存y的值为1
5. 执行`r2 = y`获取内存y的值为0
6. 执行`r4 = x`获取内存x的值为0
7. Thread 4观察到Thread 1修改的内存x的值
8. Thread 3观察到Thread 2修改的内存y的值

又如下面的例子，为了保证程序执行完之后y和z的值要么是Thread 1修改后的1和2，要么是Thread 2修改后的2和1，而不希望出现1和1或者2和2的情况。通过使用acquire和release操作（类似lock和unlock），使得y和z的修改操作可以看做是是原子的。

```
// Thread 1  |  // Thread 2
acquire(x)   |  acquire(x)
y = 1        |  y = 2
z = 2        |  z = 1
release(x)   |  release(x)
```

## RISC-V中的内存模型

RISC-V架构中提供两种内存模型供选择，RVWMO和RVTSO。RVWMO属于RC内存模型变体，RVTSO属于TSO内存模型的变体。为RVWMO内存模型编写的程序可以安全的在RVTSO内存模型上执行，反之则不行。

### RVWMO

<!--
术语：

- 成对：一条LR和一条SC指令成对，如果在program order中LR在SC前面，并且没有其他LR或者SC指令在他们之间，并且SC指令成功写入。
- acquire标记：如果AMO或者LR指令设置了aq位，则该指令拥有acquire标记
- release标记：如果AMO或者SC指令设置了rl位，则该指令拥有release标记
- 地址依赖：b对应的指令中的地址源操作数来源于或者间接来源于a对应的指令中的目标操作数
- 数据依赖：b对应的指令中的数据源操作数来源于或者间接来源于a对应的指令中的目标操作数
- 控制依赖：在program order中，a和b之间存在一条分支条件指令m，并且a对应的指令与m之间存在地址依赖或者数据依赖
- 内存操作执行了：load操作的返回值确定；store操作被所有harts观察到
-->

RVWMO内存模型由Preserved Program Order规则集和3条公理组成。其中Preserved Program Order规则集规定了哪些情况下，同一线程中的内存操作a和b之间的global memory order必须和他们之间的program order保持一致（即preserved program order）。3条公理用于增加新的限制。详细介绍如下：

- Preserved Program Order  
  如果在program order中，a内存操作在b内存操作之前，并且a和b之间满足下面的任何一条规则。则a和b之间的global memory order必须跟他们的program order保持一致：
  - 地址重叠
    - Rule 1：b为store操作；并且a和b访问的内存地址有重叠
    - Rule 2：a和b都为load操作；假设x为a和b共同读取的某个字节的内存地址，在a和b之间（program order）没有store操作写入x中；并且a和b返回x中的值是由不同的内存操作写入的。
    - Rule 3：a操作由指令AMO或者SC产生；b为load操作；并且b返回的是a操作写入的值。
  - 同步指令
    - Rule 4：a和b之间的FENCE指令要求a和b保持program order。
    - Rule 5：a有acquire标记。
    - Rule 6：b有release标记。
    - Rule 7：a有release标记；b有acquire标记。
    - Rule 8：a为LR指令生产的操作；b为SC指令生产的操作；并且他们成对。
  - 语法依赖
    - Rule 9：b和a之间存在地址依赖。
    - Rule 10：b和a之间存在数据依赖。
    - Rule 11：b为store操作；b和a之间存在控制依赖。
  - 流水线依赖
    - Rule 12：b为load操作；a和b之间（program order）存在store操作m，并且m和a之间存在地址或者数据依赖，并且b返回m写入的值。
    - Rule 13：b为store操作；在a和b之间（program order）存在指令m，并且m和a之间存在地址依赖。
- Load Value Axiom  
  load操作i返回的每个内存字节的值，为下面两个store操作中最晚的一个所写入的值（在global memory order）：  
  1. 在global memory order中发生在i之前的store操作。  
  2. 在program order中在i之前的store操作。  
  这条公理增加了对load操作返回值的限制，如果当前线程对应的store操作还没有写到shared memory组件时，返回该store的值，否则返回写到shared memory的最后一个store的值。
- Atomicity Axiom  
  如果r和w是hart *h*中的成对操作，store操作s写入内存x，r返回s写入的值，则s在global memory order中必须先于w；并且其他线程中没有写入x的store操作发生在s和w之间（global memory order）。
- Progress Axiom  
  没有内存操作会出现在无限内存操作序列之后（global memory order）。  
  解释：换句话说就是store操作会在有限的时间内被所有harts观察到。

### 相关指令

- `fence [rw]+, [rw]+`  
  r指load操作，w指store操作。该指令禁止指定的之前的内存操作发生在指定的之后的内存操作之后。目前有以下5种组合：
  - `fence rw, rw` 全禁止
  - `fence rw, w` release
  - `fence r, rw` acquire
  - `fence r, r` 读屏障
  - `fence w, w` 写屏障
- 原子操作  
  原子操作默认并不会影响指令的global memory order，但是这些指令可以携带acquire和release标记，这些标记会影响global memory order。如果指令携带acquire标记，将禁止原子操作之后的内存操作发生在原子操作之前。如果指令携带release标记，将禁止原子操作之前的内存操作发生在原子操作之后。如果携带了acquire和release标记，则原子操作前后的内存操作都不允许跨越原子操作。相当于原子操作之前有`fence rw, w`，之后有`fence r, rw`，这里原子操作同时包含load和store操作。
  - 常用原子操作
    - `amoswap.w/d rd, rs2, (rs1)` 原子交换
    - `amoadd.w/d rd, rs2, (rs1)` 原子加操作
    - `amoand.w/d rd, rs2, (rs1)` 原子与操作
    - `amoor.w/d rd, rs2, (rs1)` 原子或操作
    - `amoxor.w/d rd, rs2, (rs1)` 原子异或操作
    - `amomax[u].w/d rd, rs2, (rs1)` 原子取最大值操作
    - `amomin[u].w/d rd, rs2, (rs1)` 原子取最小值操作
  - 其余原子操作
    - `lr.w/d rd, (rs1)` 返回内存rs1处的值，同时跟处理器预约对内存地址rs1的修改
    - `sc.w/d rd, rs2, (rs1)` 如果内存地址rs1处于预约修改状态，则成功修改rs1处的值，同时移除对内存地址rs1的预约  
    对于其余原子操作，可以通过使用lr/sc的组合实现。比如原子乘操作：
    ```asm
    # atomic_mul (*m, val)
    # a0 = m
    # a1 = val
    try_again:
      lr.w t0, (a0)
      mul t1, t0, a1
      sc.w t2, t1, (a0)
      # 如果写入失败，说明其他hart有对该内存作修改，需要重新执行
      bnez t2 try_again
    ```

## 参考

- [Memory Consistency and Event Ordering in Scalable Shared-Memory Multiprocessors](http://citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.17.8112&rep=rep1&type=pdf)
- [Memory Models](https://research.swtch.com/mm)
  - Part 1: [Hardware Memory Models](https://research.swtch.com/hwmm)
  - Part 2: [Programming Language Memory Models](https://research.swtch.com/plmm)
  - Part 3: [Updating the Go Memory Model](https://research.swtch.com/gomm)
- [Weak Ordering - A New Deﬁnition](http://rsim.cs.uiuc.edu/Pubs/ps2pdf/isca90.pdf)
- [The RISC-V Instruction Set Manual](https://riscv.org/technical/specifications)
  - Volume I: [Unprivileged ISA](https://github.com/riscv/riscv-isa-manual/releases/download/Ratified-IMAFDQC/riscv-spec-20191213.pdf)
  - Volume II: [Privileged Architecture](https://github.com/riscv/riscv-isa-manual/releases/download/Priv-v1.12/riscv-privileged-20211203.pdf)
