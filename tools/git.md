# Git

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
