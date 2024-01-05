# Nand2Tetris Part 2 课程总结

距上次完成 [Nand2Tetris Part 1](https://tin.js.org/2020/07/17/nand2tetris-1/) 课程4个多月之后（2020-11-25），终于把 [Nand2Tetris Part 2](https://www.coursera.org/learn/nand2tetris2) 也完成并拿到证书。这次就没有上次那么顺利了，完成整个课程的6个项目的时间跨度为4个多月，而花在项目上面的时间肯定比之前多得多。

其中Project9是启动最晚，耗时最长的项目。该项目我计划是实现一个俄罗斯方块，并且尽可能遵守 2009 Tetris Design Guideline。我分成两个步骤来完成，首先使用JS实现这个游戏，然后在使用Jack语言照着相同的逻辑实现一遍。在使用JS开发时，将渲染部分做的尽可能独立，这样在换成课程中的Jack语言时，其他逻辑基本可以等价的转化，而渲染和按键部分基本上都进行了重写。

每个Project完成情况如下，[这里](https://github.com/lhtin/nand-2-tetris-labs)可以看到我完成的答案：

- 7-21 完成 [Project7](https://www.nand2tetris.org/project07)
- 7-24 完成 [Project8](https://www.nand2tetris.org/project08)
- 11-25 完成 [Project9](https://www.nand2tetris.org/project09)
- 8-16 完成 [Project10](https://www.nand2tetris.org/project10)
- 8-22 完成 [Project11](https://www.nand2tetris.org/project11)
- 11-16 完成 [Project12](https://www.nand2tetris.org/project12)

课程 Part 2 的侧重点是编译器和操作系统。首先引入了基于栈的字节码语言（VM Language），通过编写Translator，将其转化为 Part 1 中的机器码。然后引入类似Java的面向对象高级语言Jack，通过编写Compiler，将其编译为字节码，然后再通过Translator，转化为最终的机器码。此外，提供了一个极其简陋的OS API，提供基本的Memory、String、Screen、Keyboard、Math、Array等接口共应用程序调用。

![](images/Nand2Tetris-2/part2.png)

## 项目总结

### Project7和Project8

Project7和Project8分两步，实现一个VM语言（VM Language）到汇编语言（Hack Assembly Code，Project6实现了一个汇编语言到机器语言的汇编器）的转化器。其中字节码语言类似Java中的Bytecode，是一种基于栈的High Level IR。通过实现不同平台的VM，字节码可以在不修改的情况下在各个平台上执行，实现跨平台能力。

本项目实现的VM是堆栈机VM，数据使用一个后进先出的栈来存储，不同指令根据功能进行出栈入栈。Hack中的VM语言指令可以分成4类，分别是算术运算指令、内存操作指令、程序流程控制指令和函数调用指令。Project7实现前两类指令，Project8实现剩下的两类指令。

先来看下使用VM语言编写的斐波那契函数的大概样子：

```jack-vm
// 定义
function fibonacci 0
  push argument 0
  push constant 1
  eq
  if goto RETURN_ONE
  push argument 0
  push constant 1
  sub
  call fibonacci 1
  push argument 0
  push constant 2
  sub
  call fibonacci 1
  add
  return
label RETURN_ONE
  push constant 1
  return

// 调用 fibonacci(8)
push constant 8
call fibonacci 1
```

下面按照指令类型分成4类，讲解各个指令的详细函数。

算术运算类指令：

```
add     将栈顶两个整数出栈后相加，并将结果入栈
sub     将栈顶两个整数出栈后相减，并将结果入栈
neg     将栈顶的整数出栈后取负，并将结果入栈
eq      将栈顶两个整数出栈后进行相等比较，并将比较结果入栈
gt      将栈顶两个整数出栈后进行大于比较，并将比较结果入栈
lt      将栈顶两个整数出栈后进行小于比较，并将比较结果入栈
and     将栈顶两个元素出栈后进行按位与运算，并将结果入栈
or      将栈顶两个元素出栈后进行按位或运算，并将结果入栈
not     将栈顶的元素出栈后进行按位取反运算，并将结果入栈
```

内存操作类指令（需要结合下面的Hack内存布局图来理解）：

```
push segment index  将segment的第index个位置的内容push到栈顶
pop  segment index   将栈顶元素pop到segment的第index个位置

segment可选:
- argument      函数参数
- local         函数局部变量
- this          对象实例字段
- that          数组实例
- pointer       用于修改THIS和THAT中的内容，0表示操作THIS，1表示操作THAT。
                注意只是为了方便给编译器用，因为对象和数组实例的内存地址来自Heap，
                没有规律，所以需要给编译器一个修改THIS和THAT的方式。
                而像ARG、LCL则不需要，因为转化器在生成函数调用时，就可以知道ARG
                和LCL的位置，自己进行设置就可以，不需要暴露给编译器去设置。
- static        全局变量，开始地址固定为16
- temp          临时变量，开始地址固定为5，给编译器内部使用
- constant      常量，表示将常量push到栈顶，没有pop操作
```

![](images/Nand2Tetris-2/hack-ram.png)

程序流程控制类指令：

```
label   symbol      引入一个标签，供goto、if-goto语句使用
goto    symbol      无条件跳转
if-goto symbol      如果栈顶元素为true则跳转
```

函数调用类指令：

```
function functionName nLocals   函数声明，nLocals用于表面函数本地变量的个数
call     functionName nArgs     调用函数，nArgs用于设置被调函数的参数位置
return                          函数返回
```

### Project9

Project9首先介绍了Jack高级编程语言，它是一种面向对象高级编程语言，跟Java语言非常类似。然后让同学们使用该语言编写一个应用程序供其他同学进行评审以获得分数。根据我实际使用的情况，虽然Jack和Java类似，但是语法和库相比Java还是极其有限，对开发者非常不友好，当作一个玩具语言就好。

Jack语言介绍：

- 主要语法（示例）
  ```jack
  class Main {
    field int data;
    field Main next;
    constructor Main new(int _data, Main _next) {
      let data = _data;
      let next = _next;
      return this;
    }
    method void dispose() {
      if (~(next = null)) {
        do next.dispose();
      }
      do Memory.deAlloc(this);
      return;
    }
    method void print(boolean isFirst) {
      if (isFirst) {
        do Output.printString("[");
      }
      do Output.printInt(data);
      if (next = null) {
        do Output.printString("]");
      } else {
        do Output.printString(", ");
        do next.print(false);
      }
      return;
    }

    function int fibonacci(int n) {
      var int fm_1;
      var int m, fm;
      var int ft;

      if ((n = 0) | (n = 1)) {
        return n;
      }

      let fm_1 = 0;
      let m = 1;
      let fm = 1;

      while (m < n) {
        let ft = fm_1 + fm;
        let fm_1 = fm;
        let fm = ft;
        let m = m + 1;
      }
      return fm;
    }
    function void main() {
      var Main m;

      do Output.printString("Hello World");
      do Output.println();

      do Output.printString("Fibonacci 8: ");
      do Output.printInt(Main.fibonacci(8));
      do Output.println();

      let m = Main.new(1, null);
      let m = Main.new(2, m);
      let m = Main.new(3, m);
      let m = Main.new(4, m);
      let m = Main.new(5, m);
      do m.print(true);
      do Output.println();

      return;
    }
  }
  ```
  执行结果：
  ![demo](images/Nand2Tetris-2/demo.png)
- 面向对象。每个class一个文件，class name即为文件名称
- 变量：
  - 静态变量（static），所有实例共享
  - 实例变量（field）
  - 函数参数变量
  - 函数局部变量
- 函数
  - 构造函数 `constructor ClassName funName(...)`
  - 静态方法 `function type funName(...)`
  - 实例方法 `method type funName(...)`
- 数据类型
  - 原生类型：int（整数）、boolean（布尔）、char（字符），都占2字节
  - 内置对象类型：
    - 数组：支持`arr[i]`获取和修改
    - 字符串：支持`"Hello World!"`语法
  - 自定义对象类型：`class name`
  - 类型转换：
    - char与int按需互转
      ```
      var char c;
      let c = 33; // 'A'（ascii）
      ```
    - 可以将整数赋值给引用类型的变量
      ```
      var Array a;
      let a = 5000;
      let a[100] = 77; // 将内存地址5100处设置为77
      ```
    - 数组变量与对象实例变量可以互相转换
      ```
      var Complex c;
      var Array a;
      let a = Array.new(2);
      let a[0] = 7;
      let a[1] = 8;
      let c = a; // 等价于 Complex(7, 8)
      ```

我给Project9做的应用是[俄罗斯方块游戏](https://en.wikipedia.org/wiki/Tetris)，刚好呼应课程的题目:)。并且我做的有一个特点，就是尽量按照现代的俄罗斯方块规则来做，我选择的俄罗斯方块标准是 [*2009 Tetris Design Guideline*](https://tetris.wiki/Tetris_Guideline)，完整支持SRS旋转系统（Super Rotation System）。做的时候，我是先用JS写了一个比较完整的版本，并且在写的时候将渲染部分做的比较独立，方便后面翻译为Jack语言时对其他部分的逻辑改动较小。做完JS版本之后，再通过人工将JS版本中的逻辑翻译为Jack版本。

编写过程遇到的一些问题：

- 内存溢出问题
  - 在使用Jack编写程序时，最容易遇到的问题就是内存溢出问题。包括栈内存、堆内存，甚至静态数据区也有可能。
  - 栈内存溢出比较常出现的情况是调用层级过深。在第一版的代码中，每个游戏状态是一个函数，状态变化会导致函数调用。几个回合下来就导致了栈溢出。通过改为while循环，解决了这个问题。
  - 堆内存比较常见的问题是内存泄漏。我遇到最多的是字符串未释放的问题，在调用完`Output.printString`之后，还需要释放掉字符串，比较繁琐。于是我封装了一个`MyOutput.printString`，进行字符串的释放。
- 多任务之间同步阻塞问题
  - 在俄罗斯方块游戏中，有一个逻辑是同时有一个计时器在计数，另外又有一个键盘监听器在监听键盘按键。困难是在Jack中，计时器是同步操作，你没法在计时1秒的中间处理键盘按键事件。所以这里实际上是需要你自己在代码层面，实现一个多任务交替执行的效果。我设计的方式是将一个1秒的计时器拆分成1000个1毫秒的计时器，然后在相邻计时器之间插入当前键盘按键的判断，如果按下的键需要处理，就调用相应逻辑进行处理，处理完之后根据情况决定是否需要取消剩余未执行完的计时器。
  - 其实这有点像是实现了一个协程逻辑，难点在于各任务之间的执行粒度是怎样子的。
  - 又想了一下，如果要给VM实现多线程版本，该如何实现呢？比如说假设有几个main函数，就当作几个线程来执行。这时，SP、LCL、ARG、THIS、THAT、temp、下一个指令位置这些跟线程相关的数据都需要在切换线程的时候进行存储和恢复了。stack需要按线程进行分配，每个线程的stack起始地址不一样。然后还需要一个主程序来调度和管理这些线程的执行和结束。其中如何让线程暂停执行是一个问题，是通过插入代码到应用程序中让其主动让出CPU还是有更灵活的方式，毕竟管理线程的主程序也只是一个应用程序而已。

### Project10和Project11

Project10和Project11分两步，实现Jack高级编程语言到VM语言（字节码）的翻译。涉及到词法解析、语法解析（因为语法经过特殊设计，解析起来非常的简单）、符号处理和字节码生产等。每一块的内容都非常的简单，但是需要完整做完才能够通过测试，还是非常的有意义。

Jack语言BNF描述：

```
Class           -> 'class' ClassName '{' ClassVarDec* SubroutineDec* '}'
ClassVarDec     -> ('static' | 'field') Type VarName (',' VarName)* ';'
Type            -> 'int' | 'char' | 'boolean' | ClassName
SubroutineDec   -> ('constructor' | 'function' | 'method')
                   ('void' | Type) SubroutineName '(' ParameterList ')'
                   SubroutineBody
ParameterList   -> ((Type VarName) (',' Type VarName)*)?
SubroutineBody  -> '{' VarDec* Statements '}'
VarDec          -> 'var' Type VarName (',' VarName)* ';'
ClassName       -> Identifier
SubroutineName  -> Identifier
VarName         -> Identifier

Statements      -> Statement*
Statement       -> LetStatement | IfStatement | WhileStatement
                |  DoStatement | ReturnStatement
LetStatement    -> 'let' VarName ('[' Expression ']')? '=' Expression ';'
IfStatement     -> 'if' '(' Expression ')' '{' Statements '}'
                   ('else' '{' Statements '}')?
WhileStatement  -> 'while' '(' Expression ')' '{' Statements '}'
DoStatement     -> 'do' SubroutineCall ';'
ReturnStatement -> 'return' Expression? ';'

Expression      -> Term (Op Term)*
Term            -> IntegerConstant | StringConstant | KeywordConstant
                |  VarName | VarName '[' Expression ']' | SubroutineCall
                |  '(' Expression ')' | UnaryOp Term
SubroutineCall  -> SubroutineName '(' ExpressionList ')'
                |  (ClassName | VarName) '.' SubroutineName '(' ExpressionList ')'
ExpressionList  -> (Expression (',' Expression)*)?
Op              -> '+' | '-' | '*' | '/' | '&' | '|' | '<' | '>' | '='
UnaryOp         -> '-' | '~'
KeywordConstant -> 'true' | 'false' | 'null' | 'this'

Identifier      -> [a-zA-Z_] [a-zA-Z0-9_]*
IntegerConstant -> 0 ... 32767
StringConstant  -> '"' [^"\n]* '"'
```

### Project12

Project12的目的是实现Jack中操作系统提供的库，包括内存分配和释放、键盘事件监听、字符和图案输出到屏幕等功能。比较有挑战。

Jack系统标准库（部分接口会补充实现的难点说明，其中`init`为内部接口不对外使用）：

- Math
  - `function void init()`
  - `function int abs(int x)` 取绝对值
  - `function int multiply(int x, int y)` 相乘
    - 实现的重点是算法的选择，复杂度跟y的大小成正比的比较差，跟y的位数成正比的比较好
  - `function int divide(int x, int y)` 相除
  - `function int min(int x, int y)` 最小值
  - `function int max(int x, int y)` 最大值
  - `function int sqrt(int x)` 平方根
- String
  - `constructor String new(int maxLength)` 初始化一个可以存放maxLength个字符的字符串对象
    - 使用的时候注意用完记得释放，不然容易造成堆内存溢出问题
  - `method void dispose()`
  - `method int length()` 返回有效字符串长度
  - `method char charAt(int j)` 返回第n个字符
  - `method void setCharAt(int j, char c)` 设置第n个字符
  - `method String appendChar(char c)` 添加字符到字符串后面
  - `method void eraseLastChar()` 移除最后一个字符
  - `method int intValue()` 将字符串转换为整数
  - `method void setInt(int j)` 将整数转化为字符串
  - `function char backSpace()` 返回backspace字符
  - `function char doubleQuote()` 返回双引号字符
  - `function char newLine()` 返回换行符
- Array
  - `function Array new(int size)` 创建一个长度位size的数组
  - `method void dispose()` 释放数组
- Output
  - `function void init()`
  - `function void moveCursor(int i, int j)` 移动光标位置（0 <= i <= 511，0 <= j <= 255）
  - `function void printChar(char c)` 打印单个字符
  - `function void printString(String s)` 打印字符串
  - `function void printInt(int i)` 打印整数
  - `function void println()` 打印换行符
  - `function void backSpace()` 删除屏幕上的最后一个字符
- Screen
  - `function void init()`
  - `function void clearScreen()` 清除屏幕内容
  - `function void setColor(boolean b)` 设置接下来画图的颜色
  - `function void drawPixel(int x, int y)` 画一个点
  - `function void drawLine(int x1, int y1, int x2, int y2)` 画一条线
  - `function void drawRectangle(int x1, int y1, int x2, int y2)` 画一个矩形
  - `function void drawCircle(int x, int y, int r)` 画一个圆
- Keyboard
  - `function void init()`
  - `function char keyPressed()` 当前按下的键
  - `function char readChar()` 读取一个字符
  - `function String readLine()` 读取一行字符
  - `function int readInt()` 读取一行字符并转化为整数
- Memory
  - `function void init()`
  - `function int peek(int address)` 返回指定内存地址的内容
  - `function void poke(int address, int value)` 设置指定内存地址的内容
  - `function Array alloc(int size)` 从堆中分配size大小的内存
    - 内存管理的方式有很多种，有的比较简单，有的含有碎片整理功能
  - `function void deAlloc(Array o)` 释放`o`对象占用的内存
- Sys
  - `function void init()`
  - `function void halt()` 停机
  - `function void error(int errorCode)` 向屏幕输出错误
  - `function void wait(int duration)` 同步等待duration毫秒
    - 注意是同步阻塞。如果需要在wait的时候做其他事情，需要将wait的时间拆小，在每一个时间片段中途做点事情。比如前面提到的定期检查是否按了键盘

## 总结

**至此，Nand2Tetris的两个课程都完成了，这是我上过的最好的课程，没有之一。课程内容安排循序渐进，课程Projects贴合课程内容，难度合理。尤其是两个课程都是按照下图所示的Roadmap来展开，每当达到一个新的点就展示当前所处的位置。真的非常感谢上课老师 [Shimon Schocken](https://www.shimonschocken.com) 和 [Noam Nisan](https://www.cs.huji.ac.il/~noam) 的幸苦付出。**

![](images/Nand2Tetris-2/full.png)
