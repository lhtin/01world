# 开发工具及使用笔记

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
  ```

# Linux

## Commands

- `cd`
  - `cd -` 回到前一个访问的目录
  - `cd ~` 进入home目录
- `command 2>&1 | tee xxx.log` 将command的stdout和stderr输出到屏幕，同时保存到xxx.log文件中
- `> xxx.log && command 2>&1 >> xxx.log | tee -a xxx.log` 目的是报错stderr和stdout的内容到xxx.log，同时只在屏幕输出stderr的内容
  1. `> xxx.log` 表示清空xxx.log文件
  2. `command 2>&1 >> xxx.log` 表示将command的stdout输出追加到xxx.log文件，并且将stderr重定向到stdout
  3. `| tee -a xxx.log` 表示将前面命令的stdout，其实这是就是stderr重定向过来的内容追加到xxx.log并继续输出到stdout
- `less` 按Shift+F等待新写入的内容，按Ctrl+C取消等待
- decompress:
  - `.deb`: `ar -vx xxx.deb` 里面会有data.tar.zst文件，使用下面的方式解压
  - `.tar.zst`: 'zstd -d xxx.tar.zst && tar -xf xxx.tar`

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

- CLI Keyboard Shortcuts(https://cs61c.org/fa21/labs/lab00/)
  When typing commands or file paths:
  - `<tab>` will try autocomplete the current term based on what you wrote so far
    If the current directory has filename1.txt and filename2.txt, f<tab>1<tab> will result in filename after the first tab, and filename1.txt after you type 1 and the second tab
   - `<up arrow>` and `<down arrow>` will allow you to move through commands you've used previously, so you don't need to type them again.
   - `<ctrl> + a` will move the cursor to the beginning of the current line (helpful for fixing mistakes)
   - `<ctrl> + e` will move the cursor to the end of the current line (also helpful for fixing mistakes)
   - `<ctrl> + r` will let you search through your recently used commands

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
- [make](./make.md)
- [qemu](./qemu.md)
