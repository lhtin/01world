# 开发工具及使用笔记

- [brew](https://brew.sh) 包管理器（Mac only）
  - `brew install nvm zsh-autosuggestions`
    - [nvm](https://github.com/nvm-sh/nvm) NodeJS包管理器
    - [zsh-autosuggestions](https://github.com/zsh-users/zsh-autosuggestions) zsh自动提示插件
- 常用App
  - [Chrome](https://www.google.com/chrome)
  - [Visual Studio Code](https://code.visualstudio.com)
  - [Wireshark](https://www.wireshark.org)
- SSH key免密登录
  - 
  ```shell
  # 1. 创建key，不要设置passphrase
  ssh-keygen -t ed25519 -C "your_email@example.com"

  # 2. 也可以通过将公钥存储到远程服务器上，从而免密登陆
  ssh-copy-id -i ~/.ssh/id_ed25519.pub user_name@ip
  ```

# Linux

## Commands

- `cd`
  - `cd -` 回到前一个访问的目录
  - `cd ~` 进入home目录

## oh-my-zsh配置

- oh-my-zsh
  - `sh -c "$(curl -fsSL https://raw.github.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"`
- zsh-autosuggestins
  - `git clone https://github.com/zsh-users/zsh-autosuggestions ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-autosuggestions`
- zsh-syntax-highlighting
  - `git clone https://github.com/zsh-users/zsh-syntax-highlighting.git ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting`
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

# Windows

- Terminal
  - [panel管理](https://docs.microsoft.com/en-us/windows/terminal/panes)
    - `Alt` + `Shift` + `+` 右边开一个panel
    - `Alt` + `Shift` + `-` 下边开一个panel
    - `Alt` + Up/Down/Left/Right Arrow Key 上下左右切换焦点panel
    - `Alt` + `Shift` + Up/Down/Left/Right Arrow Key 往相应方向调整panel大小
    - `Alt` + `Shift` + `W` 关闭panel


# 其他文档

- [vim](./vim.md)
- [gdb](./gdb.md)
- [git](./git.md)
