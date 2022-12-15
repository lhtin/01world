# LLVM 中的 riscv-sextw-removal Pass 分析

> Pass代码快照：https://github.com/llvm/llvm-project/blob/3e7dad22f111b9256e79dcb9cdb1c21ff0fd73dc/llvm/lib/Target/RISCV/RISCVSExtWRemoval.cpp
>
> Testcase: https://github.com/llvm/llvm-project/blob/3e7dad22f111b9256e79dcb9cdb1c21ff0fd73dc/llvm/test/CodeGen/RISCV/sextw-removal.ll

该Pass用于移除RV64中多余的sext.w指令（即`setx.w a, b`），根据b寄存器的def情况，分以下几种情况（isSignExtendedW）：

1. 如果b的高63:32位与第31位相同，则sext.w指令可以省去，包括以下指令（isSignExtendingOpW）：
   - 包括`ADDIW b, c, imm`等计算低32位然后进行扩展的指令
   - `SRAI b, c, uimm`且uimm >= 32（保证符号位第63位被移动到了第31位及以下，因此高63:31位跟符号位一致）
   - `SRLI b, c, uimm`且uimm > 32（保证63:31全为0）
   - `ADDI b, c, imm`且c为x0寄存器（因此b的值为imm做符号扩展）
   - `ANDI b, c, imm`且imm在[0x0, 0x7FF]范围（保证c和imm做按位与时高63:31位全为0）
   - `ORI b, c, imm`且imm在[0x800, 0xFFF]范围（保证c和imm做按位或时高63:31位全为1）
   - `COPY b, c`且c为x0寄存器时，高63:31位全为0
2. 如果b是一条mv指令（`COPY b, c`）且不满足1中的情况，则分以下几种情况：
   - c是参数且属性是sign-extention，则满足条件
   - c是返回值且其BitWidth <= 32且是sign-extension或者BitWith < 32且是zero-extension，则满足条件
   - 否则递归判断c的情况
3. 如果是`BCLRI|BINVI|BSETI b, c, imm`指令且imm>=31，或者为`REM b, c, d`, `ANDI|ORI|XORI b, c, imm`，则递归判断其c寄存器的定义
   - `REM b, c, d` 如果c是32-bit，则b也一定是
4. 如果是`REMU|AND|OR|XOR|ANDN|ORN|XNOR|MAX|MAXU|MIN|MINU|PseudoCCMOVGPR|PHI`等指令，则递归判断其输入操作数是否都是sign-extension，如果是则b也是sigen-extension，则满足条件
6. 如果是`SLLI b, c, imm`且imm >= 32或者`ADDI|ADD|LD|LWU|MUL|SUB`指令，且所有use都只是用低31:0位(hasAllWUsers)，则可以将其改为w形式的指令，从而使其高63:31位为符号扩展所得，从而满足条件。

Def的使用情况（hasAllWUsers）分如下几种情况：

- use指令为所有计算低32位然后符号扩展的指令（包括`ADDIW|ADDW|...`）时满足条件
- use指令为`SLLI d, b, imm`且imm>=32 或者 `ANDI d, b, imm`且imm在[0x0, 0x7FF] 或者 `ORI d, b, imm`且imm在[0x800, 0xFFF]时，则继续递归检查d的use
- use指令为`SLL|BSET|BCLR|BINV`时
    - 如果是第二个参数，则只会使用低6bits，满足要求
    - 否则递归判断其use是否符合条件
- use指令为`SRA|SRL|ROL|ROR`时
    - 如果是第二个参数，则只会使用低6bits，满足要求
    - 否则不满足要求
- use指令为`ADD_UW|SH1ADD_UW|SH2ADD_UW|SH3ADD_UW`时
    - 如果是第一个参数，为zero-extend，满足要求
    - 否则诋毁判断其use
- use指令为`BEXTI`时
    - 如果第二个参数（imm）>= 32，则不满足条件
    - 否则满足条件
- use指令为`SB|SH|SW`时
    - 如果为第一个参数，则满足条件（只会store低32bits）
    - 否则不满足条件
- use指令为`COPY|PHI|ADD|ADDI|AND|MUL|OR|SUB|XOR|XORI|ANDN|BREV8|CLMUL|ORC_B|ORN|SH1ADD|SH2ADD|SH3ADD|XNOR|BSETI|BCLRI|BINVI`时，继续递归判断
- use指令为`PseudoCCMOVGPR`时
    - 如果其参数为第4或者第5个，则递归判断
    - 否则不满足条件
