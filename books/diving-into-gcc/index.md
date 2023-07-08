# 深入浅出GCC

## 目录

- 前言
- GCC项目介绍
  - GCC源码目录结构
  - GCC构建
  - GCC编译流程总览
  - GCC开发技巧
- GCC中端
  - Gimple IR介绍
  - 中端优化Pass介绍
  - SSA框架
  - Scalar Evaluation
  - Dependence anasynsis
  - Auto vectorize
- GCC后端
  - RTL IR介绍
  - 后端优化Pass介绍
  - 寄存器分配
  - 指令调度
  - 指令选择
- 参考资料
  - [GCC官网](https://gcc.gnu.org)
  - [GCC在线文档](https://gcc.gnu.org/onlinedocs)

## 前言

本书深入浅出地介绍了[GCC](https://gcc.gnu.org)这个历久弥新的编译器项目，并着重介绍GCC编译器中的各种核心优化。根据[GCC使命宣言](https://gcc.gnu.org/gccmission.html)，GCC项目是GNU项目的一部分，目的是不断改进GNU系统（主要是GNU/Linux系统）中使用的编译器。GCC主要用于编译C/C++、Fortran、Ada等多种编程语言编写的程序，其后端支持x86-64、ARM/AArch64、PowerPC(rs6000)、RISC-V等多种硬件架构。GCC项目遵守[GPLv3](https://www.gnu.org/licenses/gpl-3.0.en.html)开源协议，基于GCC开发的新项目也必须使用GPLv3开源协议。

> GCC development is a part of the GNU Project, aiming to improve the compiler used in the GNU system including the GNU/Linux variant. The GCC development effort uses an open development environment and supports many other platforms in order to foster a world-class optimizing compiler, to attract a larger team of developers, to ensure that GCC and the GNU system work on multiple architectures and diverse environments, and to more thoroughly test and extend the features of GCC.

[Richard Stallman](https://en.wikipedia.org/wiki/Richard_Stallman)于1987年开源了GCC的第一个版本0.9，至今已走过36年，最新发布的版本为13.1。目前主流的开源编译器除了GCC，还包括[LLVM](https://llvm.org)。LLVM项目由[Chris Lattner](https://en.wikipedia.org/wiki/Chris_Lattner)在2000年启动，最新版本为16，是GCC的主要竞争对手。LLVM相对于GCC来说开源协议更加友好（二次开发可以用于商业目的），代码上也更加模块化，更容易集成到其他项目，更容易阅读和理解。可能是感受到了LLVM带来的竞争压力，GCC在LLVM发展初期也进行了大量新功能开发（包括SSA框架、寄存器分配、自动向量化等重要优化）和代码重构。

本书主要介绍以下内容：
- GCC项目构建和调试方法
- 重要的中端优化
  - 循环相关优化
- 重要的后端优化
  - 寄存器分配
  - 指令调度
