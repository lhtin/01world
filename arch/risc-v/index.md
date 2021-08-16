# RISC-V

### 一些资源

- 规范文件：https://riscv.org/technical/specifications/
- RISC-V Software Ecosystem：https://wiki.riscv.org/display/TECH/RISC-V+Software+Ecosystem

### RISC-V ISA modules

| Module | Description |
| ------ | ----------- |
| RV32I/RV64I/RV128I/RV32E  | Base Integer Instruction Set |
| M | for integer multiplication and division |
| A | for atomic instructions |
| F | for single-precision floating-point |
| D | for double-precision floating-point |
| Q | for quad-precision floating-point |
| L | for decimal floating-point |
| C | for compressed instructions |
| B | for bit manipulation |
| J | for dynamically translated languages |
| T | for transactional memory |
| P | for packed-SIMD instructions |
| V | for vector operations |
| Zam | for misaligned atomics |
| Ztso | for totle store ordering |
| G | IMAFD, Zicsr, Zifencei |
| Zifencei | Instruction-Fetch Fence |
| Zicsr | control and status register(CSR) instructions |
| Counters | |
| RVWMO | memory consistency model |

### Modules Status

| Base | Version | Status |
| ---- | ------- | ------ |
| RVWMO | 2.0 | Ratified |
| RV32I | 2.1 | Ratified |
| RV64I | 2.1 | Ratified |
| RV32E | 1.9 | Draft |
| RV128I | 1.7 | Draft |

| Extension | Version | Status |
| --------- | ------- | ------ |
| M | 2.0 | Ratified |
| A | 2.1 | Ratified |
| F | 2.2 | Ratified |
| D | 2.2 | Ratified |
| Q | 2.2 | Ratified |
| C | 2.0 | Ratified |
| Counters | 2.0 | Draft |
| L | 0.0 | Draft |
| B | 0.0 | Draft |
| J | 0.0 | Draft |
| T | 0.0 | Draft |
| P | 0.2 | Draft |
| V | 0.7 | Draft |
| Zicsr | 2.0 | Ratified |
| Zifencei | 2.0 | Ratified |
| Zam | 0.1 | Draft |
| Ztso | 0.1 | Frozen |

## Key Parts

- Control and Status Register(CSR)
- Exception and Interrupt


## 交叉编译

- build system: 编译编译器程序的计算机
- host system: 运行编译器程序的计算机
- target system: 运行编译器程序编译出的目标程序的计算机
- build == host == target: 本地编译
- build == host != target: 交叉编译