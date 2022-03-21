# Linux

## RISC-V Linux

### 编译 Qemu

- 获取源代码
  - 使用wget
    - `wget https://download.qemu.org/qemu-6.2.0.tar.xz`
    - `tar xvJf qemu-6.2.0.tar.xz`
    - `cd qemu-6.2.0`
  - 使用git
    - `git clone https://gitlab.com/qemu-project/qemu.git`
    - `git checkout stable-X.YY`
    - `cd qemu`
- `./configure --target-list=x86_64-softmmu,riscv64-softmmu,riscv64-linux-user --prefix=/path/to/dir`
  - CentOS 7上面需要安装`glib-devel pixman-devel`
- `make -j10`
- `make install`
- `qemu-riscv64 -B 0x10000000 a.out`
