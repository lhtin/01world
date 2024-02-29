# VS Code

## 必备插件

- [ctagsx](https://marketplace.visualstudio.com/items?itemName=jtanx.ctagsx)

  根据tags文件跳转到定义的位置，需要提前生成好tags文件（比如gcc的tags生成命令：`ctags --fields=+iaS --extras=+q --exclude="testsuite/*" --exclude="config/*" --exclude-exception="config/riscv/*" --append=no --recurse --totals=yes .`）

- [Clang-Format](https://marketplace.visualstudio.com/items?itemName=xaver.clang-format)

  调用clang-format格式化代码

## Remote SSH

- 如果远程服务器网络下载很慢，可以去远程服务器kill掉下面这个wget进程，kill了之后vscode应该就会转到从本地服务器scp到远程服务器
  `wget --tries=1 --connect-timeout=7 --dns-timeout=7 -nv -O vscode-server.tar.gz https://update.code.visualstudio.com/commit:8b3775030ed1a69b13e4f4c628c612102e30a681/server-linux-x64/stable`
  - 插件日志如下
```
dccb206799f0: running
Acquiring lock on /work/home/lding/.vscode-server/bin/8b3775030ed1a69b13e4f4c628c612102e30a681/vscode-remote-lock.lding.8b3775030ed1a69b13e4f4c628c612102e30a681
Installing to /work/home/lding/.vscode-server/bin/8b3775030ed1a69b13e4f4c628c612102e30a681...
dccb206799f0%%1%%
Downloading with wget
wget download failed

printenv:
    XDG_SESSION_ID=49662
    SHELL=/bin/zsh
    SSH_CLIENT=10.99.0.86 64185 22
    USER=lding
    VSCODE_AGENT_FOLDER=/work/home/lding/.vscode-server
    MAIL=/var/mail/lding
    PATH=/usr/local/bin:/usr/bin
    PWD=/work/home/lding/.vscode-server/bin/8b3775030ed1a69b13e4f4c628c612102e30a681
    SHLVL=1
    HOME=/work/home/lding
    LOGNAME=lding
    SSH_CONNECTION=10.99.0.86 64185 10.8.6.122 22
    XDG_RUNTIME_DIR=/run/user/10044
    _=/usr/bin/printenv
    OLDPWD=/work/home/lding
Trigger local server download
dccb206799f0:trigger_server_download
artifact==server-linux-x64==
destFolder==/work/home/lding/.vscode-server/bin/==
destFolder2==/8b3775030ed1a69b13e4f4c628c612102e30a681/vscode-server.tar.gz==
dccb206799f0:trigger_server_download_end
Waiting for client to transfer server archive...
Waiting for /work/home/lding/.vscode-server/bin/8b3775030ed1a69b13e4f4c628c612102e30a681/vscode-server.tar.gz.done and vscode-server.tar.gz to exist
Found flag and server on host
dccb206799f0%%2%%
tar --version:
tar (GNU tar) 1.26
Copyright (C) 2011 Free Software Foundation, Inc.
License GPLv3+: GNU GPL version 3 or later <http://gnu.org/licenses/gpl.html>.
This is free software: you are free to change and redistribute it.
There is NO WARRANTY, to the extent permitted by law.
```
