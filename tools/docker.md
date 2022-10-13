# Docker Note

```dockerfile
FROM ubuntu:18.04
WORKDIR /home
RUN apt-get update && apt-get install -y gcc g++ gperf bison flex texinfo help2man make libncurses5-dev \
  python3-dev autoconf automake libtool libtool-bin gawk wget bzip2 xz-utils unzip patch libstdc++6 rsync mingw-w64 \
  vim git python3
```

```shell
# 构建镜像
docker image build -t ubuntu-lab .
# 跑镜像，会生成一个实例
docker run --name tin-lab1 -it -v /work/home/lding/Projects/repo-rvv/software/host/toolchain/gcc:/home/gcc ubuntu-lab
# 重新进入已经退出的实例
docker start -i tin-lab1
# 绑定到某个正在执行的实例，用于查看tin-lab1示例的stdout
docker attach tin-lab1
# 在某个正在执行的实例上重新启动一个新的shell
docker exec -it tin-lab1 bash
```
