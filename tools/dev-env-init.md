# Dev Env Init

一键初始化：`/bin/bash -c "$(curl -fsSL https://gitlab.com/lhtin-rivai/01world/-/raw/main/tools/init-dev-env.sh)"`

- [brew](https://brew.sh) 包管理器（Mac and Linux and WSL）
  - `/bin/bash -c "$(curl -fsSL https://gitlab.com/lhtin-rivai/brew-install/-/raw/tin/install.sh)"`
  - `brew install nvm`
    - [nvm](https://github.com/nvm-sh/nvm) NodeJS包管理器
- 常用App
  - [Chrome](https://www.google.com/chrome)
  - [Visual Studio Code](https://code.visualstudio.com)
  - [Wireshark](https://www.wireshark.org)
  - [MobaXterm](https://mobaxterm.mobatek.net)（windows）
- SSH key免密登录
  ```shell
  # 1. 创建key，不要设置passphrase
  ssh-keygen -t ed25519 -C "your_email@example.com"

  # 2. 将公钥存储到远程服务器上
  ssh-copy-id -i ~/.ssh/id_ed25519.pub user_name@ip
  
  # 3. 登录测试
  ssh user_name@ip
  
  # 4. 给.ssh/config中添加别名，省去输入user_name@ip的过程
  Host xxx
    User user_name
    HostName ip
  
  # 5. 如果没有免密，加-v看下debug日志，有可能服务器不支持使用public key登录
  ssh xxx -v
  
  ## 问题一：REMOTE HOSTIDENTIFICATION HAS CHANGED
  error message: 
    @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
    @    WARNING: REMOTE HOST IDENTIFICATION HAS CHANGED!     @
    @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
    IT IS POSSIBLE THAT SOMEONE IS DOING SOMETHING NASTY!
    Someone could be eavesdropping on you right now (man-in-the-middle attack)!
    It is also possible that a host key has just been changed.
    The fingerprint for the ECDSA key sent by the remote host is
    SHA256:xxxxxxxxxxxxxxxxxxxxxxxxxxx.
    Please contact your system administrator.
    Add correct host key in ~/.ssh/known_hosts to get rid of this message.
    Offending ECDSA key in ~/.ssh/known_hosts:42
    ECDSA host key for [{ip}]:{port} has changed and you have requested strict checking.
    Host key verification failed.
    fatal: Could not read from remote repository.

  删除对应的~/.ssh/known_hosts:42行，或者使用`ssh-keygen -R ip`删除cache
  ```

## oh-my-zsh配置

[my .zshrc](./.zshrc)

- oh-my-zsh
- zsh-autosuggestins
- zsh-syntax-highlighting

  ```
  sh -c "$(curl -fsSL https://gitlab.com/lhtin-rivai/ohmyzsh/-/raw/master/tools/install.sh)"
  git clone https://gitlab.com/lhtin-rivai/zsh-autosuggestions ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-autosuggestions
  git clone https://gitlab.com/lhtin-rivai/zsh-syntax-highlighting.git ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting
  ```
- 修改.zshrc

  ```shell
  plugins=(git zsh-autosuggestions zsh-syntax-highlighting)
  ```

- 减少git检查
  - `git config --global --add oh-my-zsh.hide-status 1` 取消git状态展示
  - `git config --global --add oh-my-zsh.hide-dirty 1` 取消dirty检查
- 遇到补全信息导致字符重复的问题时，可以添加下面的内容到.zshrc中。目前我在CnetOS 7.9.2009上遇到
    ```shell
    export LC_ALL=en_US.UTF-8
    export LANG=en_US.UTF-8
    ```
