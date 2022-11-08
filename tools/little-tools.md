# 小工具

- 将diff和patch转成更容易看的html网页：`diff2html --input file --style side --file a.html --  a.diff`
  - 安装：`npm install diff2html-cli`
  - 官网：https://diff2html.xyz/
- 非root权限安装yum包
  - 下载yum包：`yumdownloader package`
  - 解压（文件放在当前目录的usr目录下面）：`rpm2cpio package | cpio -idmv`
