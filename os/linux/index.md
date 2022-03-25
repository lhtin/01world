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
- `qemu-riscv64 -L /path/to/riscv/sysroot/ gcc`

### 运行Ubuntu Server

- 运行ubuntu server参加这个链接：https://wiki.ubuntu.com/RISC-V
  - 如果在非ubuntu环境下，可以先wget对应opensbi和u-boot-qemu的.deb包然后解压获取所需文件
  - `wget http://archive.ubuntu.com/ubuntu/pool/universe/o/opensbi/opensbi_0.9-2~ubuntu0.20.04.1_all.deb`
  - `wget http://archive.ubuntu.com/ubuntu/pool/main/u/u-boot/u-boot-qemu_2021.01+dfsg-3ubuntu0~20.04.4_all.deb`
  - `wget https://cdimage.ubuntu.com/releases/20.04.3/release/ubuntu-20.04.4-preinstalled-server-riscv64+unmatched.img.xz`
