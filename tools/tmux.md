# tmux

## `.tmux.conf` 配置

```
set-option -g mouse on
# 使用 vi 快捷键做移动
# Ctrl+B + [ 进入滚动模式
set-window-option -g mode-keys vi
```

登录之后自动进入tmux：
`ssh user@ip -t "tmux new-session -A -s dev"`

解耦tmux session: `tmux detach dev`

## 快捷键

- `Ctrl + B` + `D`：detach 当前窗口
  - `tmux attach-session -t dev` 重新 attach dev session
  - `tmux new-session -A -s 0` 如果有 dev session 存在则 attach，否则创建 dev session
