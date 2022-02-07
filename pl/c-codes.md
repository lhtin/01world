# C和C++的代码片段

- 打印信息时展示文件名和行号。`__FILE__`和`__LINE__`是编译器内置的宏，表示当前文件名和行号。`myprintf`必须写成宏的形式才能保证文件名和行号是调用处的信息。

  ```c
  /* test.c */
  #include <stdio.h>

  #define myprintf(format, ...) \
    printf("[%s:%d:0 %s] " format, __FILE__, __LINE__, __FUNCTION__, ##__VA_ARGS__)

  int main() {
    myprintf("Hello %s!\n", "World");
    return 0;
  }
  ```

  output:
  ```
  [test.c:8:0 main] Hello World!
  ```

- 类型转换
  - 先扩展再运算和先运算再扩展
    ```c
    #include <stdio.h>
    #include <stdint.h>
    
    int main() {
      uint32_t a = 0xFFFFFFFF;
      uint32_t b = 0x1;
      printf("sum1: %lu, sum2: %lu\n", (uint64_t)a + (uint64_t)b, (uint64_t)(a + b));
      // output:
      //   sum1: 4294967296, sum2: 0
    }
    ```
