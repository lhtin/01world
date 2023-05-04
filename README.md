> Tintin's Computer World

网页版地址：[https://lhtin.github.io/01world](https://lhtin.github.io/01world)

## Apps

- [RISC-V ISA指令速览及编解码展示](./app/riscv-isa)
- [Pipeline Viewer (Fork from Konata Project)](./app/pipeview)

## Blog

- GCC系列——自动向量化
- GCC系列——Gimple 优化
- GCC系列——RTL 优化
- GCC系列——指令调度
- GCC系列——寄存器分配
- GCC系列——IR 介绍（Gimple、RTL）
- GCC系列——编译过程介绍
- C 语言中的 Integer Promotion 规范笔记
- [RISC-V 函数栈帧及GCC实现](./blog/riscv-function-frame.md)（2023-3-19）
- [LLVM 中的 riscv-sextw-removal Pass 分析](./blog/llvm-riscv-sextw-removal-pass.md)（2022-12-15）
- [RISC-V中寻址模式总结及链接器实现](./blog/riscv-addressing-mode-and-relocation-relaxation.md)（2022-10-19）
- [CoreMark中的ee_u32类型对指令数的影响（使用RV64GC指令集）](./blog/coremark-unsigned-signed-perf-on-rv64.md)（2022-8-3）
- [软硬件接口之内存模型及RISC-V内存模型介绍](./blog/memory-model.md)（2022-5-17）

## 知识树

### 前言

欢迎来到**01 World**，这里是我通过学习和思考所构建的有关计算机领域的知识体系。内容包括计算机体系结构、编程语言、操作系统、软件工程等。对于涉及到的任何技术，我都会尝试回答**为什么需要这个技术(Why)**、**这个技术对外的接口(What)**、**这个技术的实现原理(How)**以及**它的优缺点和适用范围**这四个问题。

### 学习方法

- 费曼学习法（learning by teaching）：将你想学的概念讲解给菜鸟听，通过不断地优化（查漏补缺），加深理解，直到让菜鸟能完全地理解。
- 概念逐步深入：What、How、Why
- 逐步过滤和抽象：Data（数据） --> Information（信息） --> Knowledge（知识） --> Wisdom（智慧）

> 注：随着新知识的加入，原有的知识树结构会进行更新调整

- 01 World
  - [Computer Architecture](./arch/index.md)
    - 指令集架构
      - [RISC-V](./arch/risc-v/index.md)
      - [ARM](./arch/arm/index.md)
      - [x86-64](./arch/x86-64/index.md)
  - 编程语言
    - C/C++
      - [GCC](./pl/gcc/index.md)
      - [LLVM](./pl/llvm/index.md)
      - [Some C/C++ Codes](./pl/c-codes.md)
  - 操作系统
    - 操作系统理论
    - 实现
      - [Linux](./os/linux/index.md)
      - RT-Tread
  - 资料
    - 书
      - [Computer Organization and Design: the Hardware/Software Interface](./res/book/computer-organization-and-design/index.md)
  - 工具箱
    - [little tools](./tools/little-tools.md)
    - [dev-env-init](./tools/dev-env-init.md)
    - [Graphviz](./tools/graphviz.md)
    - [shell](./tools/shell.md)
    - [vim](./tools/vim.md)
    - [make](./tools/make.md)
    - [gdb](./tools/gdb.md)
    - [git](./tools/git.md)
    - [qemu](./tools/qemu.md)
    - [binutils](./tools/binutils.md)



