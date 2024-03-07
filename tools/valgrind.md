# Valgrind 使用笔记

> 官网：https://valgrind.org

## 内存相关错误检查

> 官方文档：https://valgrind.org/docs/manual/mc-manual.html

- 内存非法写入 `valgrind --leak-check=full --show-leak-kinds=all --track-origins=yes --verbose --log-file=valgrind-out.txt <program> <arguments>`
