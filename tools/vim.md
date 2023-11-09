# VIM使用笔记

[.vimrc](./.vimrc)

## Use Guide

- Normal Mode (Esc)
  - hjkl (前下上后)
    - 4j, 6k
  - w（光标移动到下一个word开头
  - b（光标移动到上一个word开头）
  - e（光标移动到当前word的结尾，如果已经在结尾则移动到下一个word的结尾）
  - W,B,E
  - 0（光标移动到行首）
  - $（光标移动到行尾）
  - ^（光标移动到行首非空格位置）
  - g_（光标移动到行尾非空格位置）
  - r（替换当前字符）
  - x（删除当前字符）
  - dd（删除当前行）
  - yy（复制当前行）
  - p（粘贴）
  - .（重复执行前一个命令）
  - u（回退，undo）
  - Ctrl+r（恢复，redo）
  - Ctrl+o（回到上一次光标的位置）
  - Ctrl+i（回到下一次光标的位置）
  - gg（回到文件开头）
  - G（回到文件结尾）
  - %（一对括号之间跳转）
  - *（移动到下一个跟当前光标所处word相同的word）
  - #（移动到上一个跟当前光标所处word相同的word）
  - Ctrl+\]或者Ctrl+鼠标左键 根据tags信息跳转到对应位置
  - Ctrl+t 返回上一个位置
  - `<S+*> / <S+#>` 跳转到下一个/上一个光标所在的单词
- Insert Mode
  - i（当前字符前面插入）
  - a（当前字符后面插入）
  - o（当前字符下面新增一行）
  - O（当前字符上面新增一行）
  - I（当前行首插入）
  - A（当前行尾插入）
- Visual Mode
  - v（进入选择模式并选择当前字符）
    - y（选择之后拷贝选中内容并回到Normal Mode）
    - d（选择之后删除选中内容并回到Normal Mode）
  - V（进入选择模式并选中当前行）
  - Ctrl+v（进入选择模式以矩形模式选择内容）
- Command Mode
  - `:`
    - `:123` 跳转到第123行
    - `:w` 保存内容
    - `:q` 退出
    - `:q!` 丢弃改动强制退出
    - `:%s/foo/bar/g` 将文件中所有的foo替换成bar
    - `:vs <path>` 垂直分割窗口
    - `:sp <path>` 水平分割窗口
  - `/` 搜索
    - n: 下一个搜索结果
    - N: 上一个搜索结果
- Replace Mode
  - R（进入替换模式，后续输入的字符依次替换当前字符及之后的字符）
- Terminal Mode
  - 执行`:vert term`竖直分割一个模拟term并进入终端作业模式
  - `<Esc><Esc>`退出终端作业模式（该模式下可以输入命令并执行），进入终端Normal模式
    - 需添加配置：`tnoremap <Esc><Esc> <C-\><C-N>`
  - `a` or `i` 从终端Normal模式进入终端作业模式

## 常用功能

### 选择操作的范围

- `%` 整个文件，等价于 `0,$`
- `10,20` 选择第10到20行（包含第10和第20行）
- `.,+10` 选择光标所在行及后面10行
- `0,.` 选择光标所在行及前面的所有行
- `.,$` 选择光标所在行及后面的所有行

### 替换

- `:<selected>s/<from>/<to>/<flags> 将`<selected>`选择范围中的`<from>`替换成`<to>`。
  - flags:
    - `g` 所有匹配的都替换，不带的话只替换每行的第一个匹配
    - `i` 忽略大小写
    - `c` 匹配替换前提醒
  - `<from>` 是一个正则表达式，语法参考这里：https://vimhelp.org/pattern.txt.html#regexp
  - `<to>` 可以通过`\1`，`\2`等来访问捕获的内容
- `:<selected>s/SSS/RRR/g` 将整个文件中的SSS替换成RRR，其中`<selected>`为选择的范围

## Install

```
git clone https://github.com/vim/vim.git
cd vim
./configure --prefix=/path/to/vim --enable-gui=no --enable-terminal --enable-python3interp --disable-xterm-clipboard
make -j && make install -j
```

## Plugins

### 插件手动安装

将插件放到~/.vim/pack/my/start目录中即可（vim8增加的功能），vim启动时会自动加载进来

### 常用插件

- https://github.com/preservim/tagbar
  - 配合ctags使用（需要手动编译一下https://github.com/universal-ctags/ctags）

    `./autogen.sh && ./configure --prefix=/path/to/ctags && make -j && make install -j`

  - gcc: `ctags --fields=+iaS --extras=+q --exclude="testsuite/*" --exclude="config/*" --exclude-exception="config/riscv/*" --append=no --recurse --totals=yes .`

## 待解决问题

- 如何复制到系统剪切板，同时保证启动时不会太慢

## Resource

> Help files: https://vimhelp.org/
>
> Blog: [Learn Vim Progressively](http://yannesposito.com/Scratch/en/blog/Learn-Vim-Progressively/)
>
> Blog: [Vim as IDE](https://yannesposito.com/Scratch/en/blog/Vim-as-IDE/)
