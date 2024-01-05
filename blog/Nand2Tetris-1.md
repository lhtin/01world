# Nand2Tetris Part 1 课程总结

今天（2020-7-16）完成了Coursera上的 [Nand2Tetris Part 1](https://www.coursera.org/learn/build-a-computer) 课程，写一篇文章总结一下。这次学习的速度非常快，从7月10开始完成第一个Project，到7月16完成最后一个Project并拿到证书，前后一周时间。其中Project5制作CPU和Computer花了两天时间，其余都是用一天时间完成。其中7月11和7月12是周末，花的时间比较多。工作日的话，会在上下班通勤过程中看电子教程，然后晚上回家会花大概2到3个小时。合计总耗时大概在30个小时左右。

每个Project完成情况如下，在[这里](https://github.com/lhtin/nand-2-tetris-labs)可以看到我完成的答案：

- 7-10 完成 [Project1](https://www.nand2tetris.org/project01)
- 7-11 完成 [Project2](https://www.nand2tetris.org/project02)
- 7-12 完成 [Project3](https://www.nand2tetris.org/project03)
- 7-13 完成 [Project4](https://www.nand2tetris.org/project04)
- 7-15 完成 [Project5](https://www.nand2tetris.org/project05)
- 7-16 完成 [Project6](https://www.nand2tetris.org/project06)

完成了所有Project之后，我感觉自己需要慢下来做一次总结，加深理解。先回顾每个Project做的事情，整体思考下计算机硬件的组成原理。然后重点总结下CPU的原理，这是我花时间最多的地方。

**在数字电路的设计过程中，发现很多时候会多做一些事件。比如根据条件做计算。因为事先并不知道会进入哪一个计算，所以在数字电路中实际上会两个计算都做，然后根据条件选择对应的计算结果，而不是说不去执行没有选中的那个计算。（更新7月19：最近又想了下，即使不对没有用到的计算做实际计算，其实这部分电路依然需要执行，只是执行的东西是任意的，没有意义而已）**

下图是Part 1所要完成的内容，实现一个名叫Hack的计算机，它可以执行程序、接收键盘输入并在屏幕上输出内容。

![1701691103951](images/Nand2Tetris-1/part1.png)

## 项目总结

整个课程，除了Project6是开发汇编器，其余的都是跟硬件相关。

### Project1

Project1使用最原始的与非门（Nand），使用硬件描述语言（HDL）开发非门（Not、Not16）、与门（And、And16）、或门（Or、Or16、Or8Way）、异或门（Xor）、选择器（Mux、Mux16、Mux4Way16、Mux8Way16）、分配器（DMux、DMux4Way、DMux8Way）。只要了解每个电路的功能（也就是布尔运算规则），实现这些电路就不难了，可以通过在纸上写出真值表来尝试各种可能。

选择与非门的一个重要原因是因为其他的电路都可以通过它来实现，但如果选或门或者与门就没法实现。当时开发时不理解为什么要扩展成这些电路，其他电路不行吗。做到后面的Project时就明白了，因为后面都会用到。所以有时候我在想，老师是怎么知道恰好需要这些电路的呢？我怀疑老师是先假设需要实现某种电脑规范，然后通过一层一层分解，最终推出所需要的电路，然后安排在Project中去完成。这也挺有意思的，老师的设计思路跟上课的内容刚好相反。所以即使我能够完成所有的Project，如果让我自己来设计一台电脑，大概率是没法设计出来。

下面列举下非门、与门、或门和异或门是如何构建的，非常的巧妙（注意实际的项目中是使用一种HDL语言来描述）：

```
// 默认存在的电路。表示Not-And，Nand(1,1)返回0，其他情况返回1
Nand(a, b) = ...

// Not(0)返回1，Not(1)返回0
Not(in) = Nand(in, in)

// And(1,1)返回1，其他情况返回0
And(a, b) = Not(Nand(a, b))

// Or(0,0)返回0，其他情况返回1
Or(a, b) = Nand(Not(a), Not(b))

// Xor(0,1)或者Xor(1,0)返回1，其他情况返回0
Xor(a, b) = Or(And(Not(a), b), And(a, Not(b)))
```

### Project2

Project2使用Project1构建的各种电路构建加法器（HalfAdder、FullAdder、Add16、Inc16）和CPU中的算数逻辑单元（ALU）。本项目中的ALU功能比较简单，只包含基本的加减运算，不包括乘法和除法运算。从最基本的2个bit相加开始构建加法器比较简单，稍微困难点的是构建ALU。基本的解决思路是先计算出某个控制位控制的两种运算，然后让选择器根据控制位最终去选择所需要的结果。在整个的开发过程中，可以充分利用课程提供的Hardware Simulator工具和测试脚本进行验证。通过观察具体是什么语句出错，可以很容易找到问题并解决。

Hack ALU支持的运算如下：

```
ALU(x, y) = 0 | 1 | -1 | x | y | !x | !y | -x | -y
          | x+1 | y+1 | x-1 | y-1 | x+y | x-y | y-x
          | x&y | x|y
```

### Project3

Project3引入一种新类型的电路，[时序逻辑电路](https://en.wikipedia.org/wiki/Sequential_logic)，而前面构建的都是[组合逻辑电路](https://en.wikipedia.org/wiki/Combinational_logic)。在时序逻辑电路中，物理时间会被切分成一个一个的离散时间，即时钟周期。时序逻辑电路的特点是其输出跟时间有关系，也就是说T时钟周期的输出，跟T-1时钟周期的输入有关系。Project3提供了内置的[DFF触发器](https://en.wikipedia.org/wiki/Flip-flop_(electronics)#D_flip-flop)，功能是将T时钟周期的输入，在T+1时钟周期输出，即将输入延后一个时钟周期输出。在结合前面制作的组合逻辑电路，就可以制造出本项目中的所有电路，包括Bit（1位存储器）、Register（16位存储器）、RAM系列（RAM8、RAM64、RAM512、RAM4K、RAM16K）、PC（程序计数器）。

**话说为什么要引入时序逻辑电路呢？如果我需要执行的计算能够完全通过组合逻辑电路瞬间完成，且不是很香？我想，引入时序逻辑电路应该是一种用时间换取空间的策略。比如假设我需要执行a+b+c这个动作，如果我设计一个组合逻辑电路，那需要设计2个加法器才行，第一个加法器将a和b相加，第二个加法器将第一个加法器的结果加上c，得出最终的结果。但如果使用时序逻辑电路，其实我们只需要一个加法器，在第二次做加法的时候，将第一次做加法的结果作为输入重新传给加法器。这样，不管有多少次加法运算，我们都只需要一个加法器电路，只要保证每次加法运算在时间上错开进行。进一步，不管我们的程序多复杂，只需要设计一个能执行每一种指令的CPU即可，然后按照时间顺序一条一条执行，而不需要设计一个跟我们的程序等价的组合逻辑电路。这样的电路非常复杂，而且这种电路一点都不通用。**

### Project4

Project4介绍Hack计算机的机器语言规范，包括机器语言和对应的汇编语言。类似x86汇编，但是简单很多。先来简单介绍下Hack计算机，Hack计算机包含了一个CPU和两个寄存器（A和D）。其中A中的值可以当成数据来用，也可以当成RAM中的内存地址来用。当成内存地址用时，M会代表地址中的值。D用于存储数据。此外还提供了存储指令的ROM和存储数据的RAM。在RAM中，有一块区域代表显示器内存，通过修改该区域的内容，就可以控制屏幕的显示内容（项目中只支持显示黑白两种颜色）。还有另外一个区域，表示当前键盘按下的键值，通过读取该区域的值，就可以知道当前用户按的键。最后，Hack计算机还包含一个PC程序计数器，可以输出下一条指令所处的ROM地址。

### Project5

Project5根据Project1-3中的电路，实现一个支持Project4所描述的功能的计算机硬件。主要包括指令存储器ROM、内存RAM和CPU，其中最难实现的要属CPU（我认为这也是整个课程最难的部分了）。项目中已经提供了CPU的基本电路图，需要我们做的是根据指令，生成各个电路的控制内容。比如如果是`@123`指令，则表示将123设置到A寄存器中。

完整的CPU电路图如下（红色部分即为缺失的，需要我们完成的逻辑）：

![](./images/Nand2Tetris-1/CPU.png)

在设计CPU时，需要注意几点：

1. A类指令和C类指令，控制的位置不一样，A类指令控制A寄存器的读写，C类指令控制的是ALU的计算，以及计算完是否将结果写入A寄存器和D寄存器。
2. 根据C类指令和ALU的计算结果，设置PC电路的各个输入，从而输出下一条指令的ROM地址。
3. **每条指令都是执行一个时钟周期（这点非常重要）。这点决定了在处理C类指令时，是直接将指令中的控制位传给ALU等对应的位置。而不是想成先经过A寄存器（一个时钟周期），然后经过ALU运算，才设置D寄存器和A寄存器（又是一个时钟周期）。一开始这样子想导致我当时将控制位也进行延后一个时钟周期处理。这一点我是通过CPU的测试文件看出来的。测试中在设置了指令之后，就调用Tick Tock一次，所以是一个时钟周期。**

### Project6

Project6是实现一个汇编器程序，将Hack汇编语言转化为Hack机器语言。我使用JS实现，相对来说比较简单。为了方便调试程序的问题，我将我自己写的汇编器程序所生成的机器码和课程提供的汇编器生成的机器码做文件级别的diff比较，这样会比较容易看出是哪行代码翻译的问题。为了方便查找转化后的行数对应到源码中的指令，我会在汇编过程中输出仅移除源码中的符号、注释和空格之后的源代码文件。

Hack汇编语言BNF描述如下：

```
Program -> Stats
Stats   -> Stat Stats
        |  ε
State   -> A-Inst | C-Inst | Branch | Comment
A-Inst  -> "@" num | '@' Symbol
C-Inst  -> Dest comp Jump
Branch  -> "(" symbol ")"
Comment -> "//" [^\n]+

Symbol  -> "R0" | ... | "R15"
        |  "SP" | "LCL" | "ARG" | "THIS" | "THAT" | "SCREEN" | "KBD"
        |  symbol
Dest    -> dest "="
        |  ε
Jump    -> ";" jump
        |  ε

dest    -> "A" | "D" | "M" | "AD" | "AM" | "MD" | "AMD"
comp    -> "0" | "1" | "-1" | "D" | "A" | "!D" | "!A" | "-D" | "-A"
        |  "D+1" | "A+1" | "D-1" | "A-1" | "D+A" | "D-A" | "A-D" | "D&A" | "D|A"
        |  "M" | "!M" | "-M" | "M+1" | "M-1" | "D+M" | "D-M" | "M-D" | "D&M" | "D|M"
jump    -> "JGT" | "JEG" | "JGE" | "JLT" | "JNE" | "JLE" | "JMP"
num     -> [0-9]+
symbol  -> [a-zA-Z_.$:][a-zA-Z_.$:0-9]+
```

示例程序：

```
// Computes R2 = max(R0, R1)  (R0,R1,R2 refer to RAM[0],RAM[1],RAM[2])

   @R0
   D=M              // D = first number
   @R1
   D=D-M            // D = first number - second number
   @OUTPUT_FIRST
   D;JGT            // if D>0 (first is greater) goto output_first
   @R1
   D=M              // D = second number
   @OUTPUT_D
   0;JMP            // goto output_d
(OUTPUT_FIRST)
   @R0
   D=M              // D = first number
(OUTPUT_D)
   @R2
   M=D              // M[2] = D (greatest number)
(INFINITE_LOOP)
   @INFINITE_LOOP
   0;JMP            // infinite loop
```
