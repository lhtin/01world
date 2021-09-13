# Mac开发环境

- [oh-my-zsh](https://ohmyz.sh/) Shell
  - `git config --global --add oh-my-zsh.hide-status 1` 取消git状态展示
  - `git config --global --add oh-my-zsh.hide-dirty 1` 取消dirty检查
- [brew](https://brew.sh) 包管理器
  - `brew install nvm zsh-autosuggestions`
    - [nvm](https://github.com/nvm-sh/nvm) NodeJS包管理器
    - [zsh-autosuggestions](https://github.com/zsh-users/zsh-autosuggestions) zsh自动提示插件
- 常用App
  - [Chrome](https://www.google.com/chrome)
  - [Visual Studio Code](https://code.visualstudio.com)
  - [Wireshark](https://www.wireshark.org)
- 生成SSH key并在Github上使用
  - SSH key用于解决鉴权问题
  - 
  ```shell
  # 1. 创建key
  ssh-keygen -t ed25519 -C "your_email@example.com"

  # 2. 启动ssh-agent
  eval "$(ssh-agent -s)"
  # 然后将下面的内容添加到~/.ssh/config文件中
  Host *
    AddKeysToAgent yes
    UseKeychain yes
    IdentityFile ~/.ssh/id_ed25519

  # 3. 添加key到agent，-K表示添加passphrase到keychain
  ssh-add -K ~/.ssh/id_ed25519

  # 4. 将~/.ssh/id_ed25519.pub添加到Github中
  pbcopy < ~/.ssh/id_ed25519.pub # 拷贝

  # 5. 也可以通过将公钥存储到远程服务器上，从而免密登陆
  ssh-copy-id -i ~/.ssh/id_ed25519.pub user_name@ip
  ```

# Linux

## Commands

- `cd`
  - `cd -` 回到前一个访问的目录
  - `cd ~` 进入home目录

# Windows

- Terminal
  - [panel管理](https://docs.microsoft.com/en-us/windows/terminal/panes)
    - `Alt` + `Shift` + `+` 右边开一个窗口
    - `Alt` + `Shift` + `-` 下边开一个窗口
    - `Alt` + Up/Down/Left/Right Arrow Key 上下左右切换焦点窗口
    - `Alt` + `Shift` + Up/Down/Left/Right Arrow Key 往相应方向调整窗口大小


# 其他文档

- [vim](./vim.md)
- [gdb](./gdb)
- [git](./git)