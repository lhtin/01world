# Git

## .gitconfig

```
[core]
        filemode = true # 提交时包含文件得可执行权限属性
```

## 常用命令

- `git show <commit-id>` 展示commit-id的修改内容
- `git reset --soft hash` 将hash之后的所有commit合并为一个修改并staged，需要重新commit提交。一般用于将多个相关的commit合并为一个。`hash`也可以改为`HEAD~N`，表示将最近N个commit合并为一个
- `git commit --amend` 修改最后一条commit信息，同时将staged中的修改内容包含在里面
  - `git commit --amend --no-edit` 只是将staged中的内容包含在里面，但是不修改commit message，不过hash值是会改变的
- git stash
  - `git stash push -u -m "stash message"` stash当前的所有改动，包括untracked的文件
  - `git stash pop` 应用第0个stash并从stash list中丢弃
  - `git stash pop stash@{3}` 应用第3个stash并从stash list中丢弃
  - `git stash show -p stash@{0}` 展示第0个stash（即最近一个stash）中的改动内容
  - `git stash show stash@{0}` 展示第0个stash中的文件改动列表
  - `git stash drop stash@{1}` 丢弃第1个stash

## Send Patchs

.gitconfig

```
[user]
email = lehua.ding@rivai.ai
name = Lehua Ding

[sendemail]
  smtpUser = lehua.ding@rivai.ai
  smtpPass = <your email password>
  smtpServer = <your smtp server domain>
  smtpServerPort = <your smtp server port>
  smtpEncryption = tls
  suppresscc = self
```

- `mkdir patchs && cd patchs`
- `git format-patch -1`
- `../contrib/mklog.py xxx.patch` 生成ChangeLog
- `vim xxx.patch` 修改xxx.patch，将前一步输出的ChangeLog copy进去，同时添加patch的描述
- `git send-email xxx.patch --to xxx --cc xxx` 发送邮件到对应的邮件列表

