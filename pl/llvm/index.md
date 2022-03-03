# LLVM

## 更新regression testcase

- `cd build && ninja check-llvm` 运行全部的回归测试
- 更新测试用例：`./llvm/utils/update_llc_test_checks.py --llc-binary build/bin/llc llvm/test/CodeGen/RISCV/rvv/vslide1down-rv32.ll`
- 运行更新后的测试用例：`./build/bin/llvm-lit llvm/test/CodeGen/RISCV/rvv/vslide1down-rv32.ll`

## 提交Patch

- `git clang-format HEAD~1` 统一代码风格
- `git commit --amend -a` 如果有变动则提交
- `git diff HEAD~1 -U999999 > fix.patch` 得到patch，去https://reviews.llvm.org/ 上面提交
