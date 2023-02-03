# LLVM

## 调试LLVM

- `ninja tools/llc/install` 只编译和安装llc，增量编译的时候更快

## 更新regression testcase

- `cd build && ninja check-llvm` 运行全部的回归测试
- 查看用例失败原因，确认是否是正常的：`./build/bin/llvm-lit -v llvm/test/CodeGen/RISCV/rvv/vsetvli-insert-crossbb.ll  | less`
- 更新测试用例：`./llvm/utils/update_llc_test_checks.py --llc-binary build/bin/llc llvm/test/CodeGen/RISCV/rvv/vslide1down-rv32.ll`
- 运行更新后的测试用例：`./build/bin/llvm-lit llvm/test/CodeGen/RISCV/rvv/vslide1down-rv32.ll`

## 提交Patch

- `git clang-format HEAD~1` 统一代码风格
- `git commit --amend -a` 如果有变动则提交
- `git diff HEAD~1 -U999999 > fix.patch` 得到patch，去https://reviews.llvm.org/ 上面提交

## 使用Clang编译RISC-V程序

- `clang --target=riscv32-unknow-elf -march=rv32gc_v1p0 slide1up.c -c` 编译目标文件，不依赖gnu-toolchain
- `clang --gcc-toolchain=/path/to/riscv64 --sysroot=/path/to/riscv64/sysroot --target=riscv64-unknow-linux-gnu -march=rv64gc_v1p0 --static hello.c` 编译可执行文件
