# Git

- `git reset --soft hash` 将hash之后的所有commit合并为一个修改并staged，需要重新commit提交。一般用于将多个相关的commit合并为一个。`hash`也可以改为`HEAD~N`，表示将最近N个commit合并为一个
- `git commit --amend` 修改最后一条commit信息，同时将staged中的修改内容包含在里面
  - `git commit --amend --no-edit` 只是将staged中的内容包含在里面，但是不修改commit message，不过hash值是会改变的
