# 计算机体系结构（arch）

## 流水线

将指令分成多个阶段执行，这样从一瞬间来看。每个阶段都在执行指令，只是执行的是不同的指令的不同阶段。从而提高吞吐量。

带来的问题：

- 前后指令有数据依赖，会导致后面的指令需要等待
  - 在依赖的指令之间插入无依赖的指令（编译器）
  - 分支指令依赖：通过分支预测方式解决

