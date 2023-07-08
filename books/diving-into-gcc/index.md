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

本书深入浅出地介绍了GCC这个历久弥新的编译器项目，是作者研究GCC项目过程中的产物。根据[GCC使命宣言](https://gcc.gnu.org/gccmission.html)，GCC项目是GNU项目的一部分，目的是为了不断改进GNU系统（包括GNU/Linux系统）中使用的编译器。

> GCC development is a part of the GNU Project, aiming to improve the compiler used in the GNU system including the GNU/Linux variant. The GCC development effort uses an open development environment and supports many other platforms in order to foster a world-class optimizing compiler, to attract a larger team of developers, to ensure that GCC and the GNU system work on multiple architectures and diverse environments, and to more thoroughly test and extend the features of GCC.
