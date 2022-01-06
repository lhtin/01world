# C和C++的代码片段

- 打印信息时展示文件名和行号

  ```c
  /* test.c */
  #include <stdio.h>

  #define myprintf(format, ...) \
    printf("[%s:%d:0] " format, __FILE__, __LINE__, __VA_ARGS__)

  int main(){
    myprintf("Hello %s!\n", "World");
  }
  ```

  output:
  ```
  [test.c:8:0] Hello World!
  ```

  注：`__FILE__`和`__LINE__`时编译器内置的宏，表示当前文件名和行号。`myprintf`必须写成宏的形式才能保证文件名和行号是调用者那边的信息
