# CoreMark中的ee_u32类型对指令数的影响（使用RV64GC指令集）

在SiFive的CoreMark仓库中，有一个很有意思的[提交](https://github.com/sifive/benchmark-coremark/commit/287f632b3e1fa3d9ea87e03a30d33ed6c1184485#diff-28044a0559f6c2d014a958735e1b39485e9ae40bcb7a2f1478663da59b855905L102)，将ee_u32的原始类型由`unsigned int`改为`signed int`（后文统一使用`uint32_t`和`int32_t`表示）。使用RV64GC指令集时，这个改动导致指令数从 363781 降到了 308973 （编译参数 `-O2 -fno-builtin`），指令数降幅到达15%。为什么这个小改动会导致如此大的降幅呢？但是当使用RV32GC指令集时，指令数仅从 308105 变到 308097，几乎没有变化。为什么又只在RV64上才会出现如此大的差距呢？下面就来分析分析。

## 导致差异的代码片段

通过统计各个函数在Spike上执行的指令数，发现是`core_matrix.c`中的相关代码导致指令数增加较多（分别是`matrix_mul_matrix_bitextract`、`matrix_mul_matrix`、`matrix_test`、`matrix_mul_vect`这几个函数），结果如下：

```
# unsigned 版本
core_state_transition ( 80001e62 ~ 80002104 ) : insn: 234, execute_insns: 68112, per: 19%
core_bench_list ( 8000133a ~ 8000152c ) : insn: 168, execute_insns: 65160, per: 18%
matrix_mul_matrix_bitextract ( 800019ca ~ 80001a4e ) : insn: 48, execute_insns: 62412, per: 17%
matrix_mul_matrix ( 80001956 ~ 800019c8 ) : insn: 43, execute_insns: 47832, per: 13%
matrix_test ( 80001a50 ~ 80001d42 ) : insn: 280, execute_insns: 33036, per: 9%
crc16 ( 800023bc ~ 80002416 ) : insn: 35, execute_insns: 23170, per: 6%
crcu32 ( 8000230e ~ 800023ba ) : insn: 67, execute_insns: 21920, per: 6%
core_bench_state ( 80002106 ~ 80002248 ) : insn: 120, execute_insns: 14800, per: 4%
core_list_mergesort ( 8000127a ~ 80001338 ) : insn: 83, execute_insns: 7836, per: 2%
crcu16 ( 800022ba ~ 8000230c ) : insn: 33, execute_insns: 5128, per: 1%
calc_func ( 8000109e ~ 8000117c ) : insn: 77, execute_insns: 4644, per: 1%
cmp_idx ( 80001050 ~ 8000109c ) : insn: 23, execute_insns: 3971, per: 1%
matrix_mul_vect ( 80001904 ~ 80001954 ) : insn: 28, execute_insns: 3568, per: 1%
cmp_complex ( 8000117e ~ 800011a8 ) : insn: 19, execute_insns: 2090, per: 1%
core_bench_matrix ( 80001d44 ~ 80001d62 ) : insn: 15, execute_insns: 60, per: 0%
iterate ( 800016ca ~ 80001724 ) : insn: 33, execute_insns: 33, per: 0%
start_time ( 800024ca ~ 800024e2 ) : insn: 7, execute_insns: 6, per: 0%
main ( 800030f4 ~ 80003876 ) : insn: 655, execute_insns: 3, per: 0%

# signed 版本
core_state_transition ( 80001e6e ~ 80002110 ) : insn: 234, execute_insns: 68112, per: 22%
core_bench_list ( 8000133a ~ 8000152c ) : insn: 168, execute_insns: 65160, per: 21%
matrix_mul_matrix_bitextract ( 80001962 ~ 800019e8 ) : insn: 51, execute_insns: 38584, per: 12%
matrix_test ( 800019ea ~ 80001d00 ) : insn: 296, execute_insns: 26884, per: 9%
matrix_mul_matrix ( 800018ec ~ 80001960 ) : insn: 46, execute_insns: 24004, per: 8%
crc16 ( 800023be ~ 80002418 ) : insn: 35, execute_insns: 23170, per: 7%
crcu32 ( 8000230e ~ 800023bc ) : insn: 67, execute_insns: 21920, per: 7%
core_bench_state ( 80002112 ~ 80002248 ) : insn: 116, execute_insns: 14792, per: 5%
core_list_mergesort ( 8000127a ~ 80001338 ) : insn: 83, execute_insns: 7836, per: 3%
crcu16 ( 800022ba ~ 8000230c ) : insn: 33, execute_insns: 5128, per: 2%
calc_func ( 8000109e ~ 8000117c ) : insn: 77, execute_insns: 4644, per: 2%
cmp_idx ( 80001050 ~ 8000109c ) : insn: 23, execute_insns: 3971, per: 1%
matrix_mul_vect ( 8000189c ~ 800018ea ) : insn: 28, execute_insns: 2576, per: 1%
cmp_complex ( 8000117e ~ 800011a8 ) : insn: 19, execute_insns: 2090, per: 1%
core_bench_matrix ( 80001d02 ~ 80001d20 ) : insn: 15, execute_insns: 60, per: 0%
iterate ( 80001654 ~ 800016ae ) : insn: 33, execute_insns: 33, per: 0%
start_time ( 800024cc ~ 800024e4 ) : insn: 7, execute_insns: 6, per: 0%
main ( 800030f4 ~ 80003872 ) : insn: 650, execute_insns: 3, per: 0%
```

从中选择一个稍微简单一点的函数`matrix_add_const`（上述没有列出来是因为内联到了`matrix_test`中），将其简化后的两个版本的代码如下，差异点在于变量 `N`、`i`、`j` 的类型：

```c
/* core_matrix.c */

/* 无符号版本 */
void
matrix_add_const_unsigned(uint32_t N, char *A, char val)
{
    uint32_t i, j;
    for (i = 0; i < N; i++)
    {
        for (j = 0; j < N; j++)
        {
            A[i * N + j] += val;
        }
    }
}

/* 有符号版本 */
void
matrix_add_const_signed(int32_t N, char *A, char val)
{
    int32_t i, j;
    for (i = 0; i < N; i++)
    {
        for (j = 0; j < N; j++)
        {
            A[i * N + j] += val;
        }
    }
}
```

编译后的汇编如下（编译参数 `-O2`）（[在线地址](https://godbolt.org/z/1ab5W13cc)）：

```asm
matrix_add_const_unsigned:
        mv      a6,a0
        li      a7,0
        li      t1,0
        beq     a0,zero,.L9
.L2:
        mv      a4,a7
.L4:
        slli    a5,a4,32
        srli    a5,a5,32
        add     a5,a1,a5
        lbu     a3,0(a5)
        addiw   a4,a4,1
        addw    a3,a3,a2
        sb      a3,0(a5)
        bne     a6,a4,.L4
        addiw   t1,t1,1
        addw    a7,a0,a7
        addw    a6,a0,a6
        bne     a0,t1,.L2
        ret
.L9:
        ret

matrix_add_const_signed:
        ble     a0,zero,.L10
        add     a3,a1,a0
        li      a6,0
.L12:
        mv      a5,a1
.L13:
        lbu     a4,0(a5)
        addi    a5,a5,1
        addw    a4,a4,a2
        sb      a4,-1(a5)
        bne     a5,a3,.L13
        addiw   a6,a6,1
        add     a1,a1,a0
        add     a3,a3,a0
        bne     a0,a6,.L12
.L10:
        ret
```

从汇编中可看到unsigned和signed版本内层循环体（也就是 `matrix_add_const_unsigned` 中的 `.L4` 和 `matrix_add_const_signed` 中的 `.L13`）的差异。unsigned 版本开头多了三条指令，用于计算此时操作的内存地址，做了一个高32位清零的操作后再加上 `A` 地址。而 signed 版本则是直接在 `A` 的基础上递增 1。

通过分析dump出来的tree，发现这两段代码在ivopts pass之后出现差异。如果禁掉该优化（`-fno-ivopts`，ivopts是指Induction Variable Optimizations），最后的tree（optimized pass）的差别就是类型转化的差别（[在线地址](https://godbolt.org/z/838x4a5M6)），unsigned版是 `uint32_t` 转 `uint64_t`（也就是tree中的 `sizetype`，在RV64系统中为64位无符号整形，后文统一使用 `uint64_t` 表示），而signed版是 `int32_t` 转 `uint64_t`。进而导致expand之后生成的rtl（[在线地址](https://godbolt.org/z/GaEWcKv63)）出现了差异。`uint32_t` 转 `uint64_t` 时，使用 zero_extend，而 `int32_t` 转 `uint64_t` 时使用了 sign_extend。这个差别解释了 `slli` 和 `srlli` 指令的出现。

```
# unsigned
gimple:
  uint32_t _2;
  _3 = (uint64_t) _2;

=> rtl:
  (insn 22 21 23 5 (set (reg:DI 84)
          (zero_extend:DI (reg:SI 83))) "/app/example.c":12:14 -1
      (nil))

# signed
gimple:
  int32_t _2;
  _3 = (uint64_t) _2;

=> rtl:
  (insn 40 39 41 6 (set (reg/v:DI 78 [ i ])
          (sign_extend:DI (reg:SI 91))) "/app/example.c":8:25 -1
      (nil))
```

回头来看看前面的ivopts优化，通过观察tree的差异，发现内层循环的迭代方式不同。两者加起来就导致了 unsgined 和 signed 指令数差异巨大。将上面的汇编等价翻译回如下的C代码，就可以看到ivopts优化导致的不同点，相比 signed 版本，unsigned 版本多了 `A + j` 这一步。这一步首先会导致 `j` 类型转化为 `uint64_t`（即多出了 `slli` 和 `srli` 指令），然后再多一步加法操作计算最终的内存地址，因此总共多出了3条指令：

```c
void
matrix_add_const_unsigned(uint32_t N, char *A, char val)
{
  if (N == 0) {
    return;
  }
  uint32_t start = 0;
  uint32_t end = N;
  for (uint32_t i = 0; i != N; i += 1) {
    for (uint32_t j = start; j != end; j += 1) {
      *(A + j) += val;
    }
    start += N;
    end += N;
  }
}

void
matrix_add_const_signed(int32_t N, char *A, char val)
{
    if (N <= 0) {
        return;
    }
    char* start = A;
    char* end = A + N;
    for (int32_t i = 0; i != N; i += 1) {
      for (char* ptr = start; ptr != end; ptr += 1) {
        *ptr += val;
      }
      start += N;
      end += N;
    }
}
```

## 原因分析

首先分析为啥 `uint32_t` 转 `uint64_t` 需要移位，而 `int32_t` 转 `uint64_t` 则不需要。根据RV64I指令集，在RV64 CPU中做32位的数值运算时（不管有符号还是无符号运算），会将32位结果进行符号扩展为64位存放到64位寄存器中。因此32位数值（`0x0~0xFFFFFFFF`）在RV64寄存器中的表示范围分成了 `0x0~0x7FFFFFFF` 和 `0xFFFFFFFF80000000~0xFFFFFFFFFFFFFFFF`。

现在假设需要计算 `A + j` 的值，其中 `A` 的类型为 `uint64_t`，`j` 的类型为 `uint32_t`。在相加之前，需要先将 `j` 转为 `uint64_t` 类型，又因为本身`j`是存在在64为寄存器中，当 `j >= 0x80000000` 时，对应寄存器的高32位为1，因此必须先把寄存器的高32位清零，否则计算结果不符合预期（比如当 `j = 0xFFFFFFFF` 时，在64位寄存器中表示为 `0xFFFFFFFFFFFFFFFF`，这时如果使用RV64I中的 `add` 指令相加，会导致 `j` 寄存器中的高32位参与运算，相当于多加了 `0xFFFFFFFF00000000`）。

但是如果 `j` 的类型为 `int32_t`，根据C中的类型转换规范（参见这个[回答](https://stackoverflow.com/a/50632/5549292)），如果 `j >= 0`，则不做改动，也就是高32位补0（刚好正数符号位扩展就是高位补0）。如果 `j < 0`，则将 `j` 加上 `UINT64_MAX + 1` 使得其结果能被 `uint64_t` 表示（`UINT64_MAX` 为 `0xFFFFFFFFFFFFFFFF`）。比如 `-1` 会被转换为 `UINT64_MAX`（如果作为 `int64_t` 解释的话就是 `-1`），`-2` 会被转换为 `UINT64_MAX - 1`（同样的如果作为 `int64_t` 解释的话就是 `-2`），所以负数的转换实际上就是高32位补1（刚好负数符号位扩展就是高位补1）。因此，`int32_t` 转换为 `uint64_t` 其实只需要将 `j` 在寄存器中的低32位做符号扩展成64位即可，而前面提到RV64中的32位数值运算的结果就是进行符号位扩展之后存储到64位寄存器，所以在RV64上并不需要做啥处理。

另外如果 `A` 的类型也是32位的话，则不需要清零处理，因为RV64中提供了 `addw` 指令只对寄存器低32位做相加（这时候就不需要管它是有符号还是无符号）。

而ivopts pass导致的差异留待后面分析。

## ARM64和x86-64指令集的表现

对于ARM64指令集，如果禁掉ivopts pass的话（编译参数 `-O2 -fno-ivopts`），循环部分的指令数并没有差距，核心原因是 `ldrb` 和 `strb` 指令支持32位和64位寄存器直接相加，并且相加时可以指定32位操作数如何扩展为64位（uxtw表示无符号扩展，sxtw表示有符号扩展，[在线地址](https://godbolt.org/z/dohh7M8eT)）：

```asm
matrix_add_const_unsigned:
        and     w2, w2, 255
        mov     w7, 0
        cbz     w0, .L1
.L2:
        mul     w6, w0, w7
        mov     w3, 0
.L4:
        add     w5, w6, w3
        add     w3, w3, 1
        ldrb    w4, [x1, w5, uxtw]
        add     w4, w2, w4
        strb    w4, [x1, w5, uxtw]
        cmp     w0, w3
        bhi     .L4
        add     w7, w7, 1
        cmp     w0, w7
        bhi     .L2
.L1:
        ret

matrix_add_const_signed:
        and     w2, w2, 255
        mov     w7, 0
        cmp     w0, 0
        ble     .L9
.L10:
        mul     w6, w0, w7
        mov     w3, 0
.L12:
        add     w5, w6, w3
        add     w3, w3, 1
        ldrb    w4, [x1, w5, sxtw]
        add     w4, w2, w4
        strb    w4, [x1, w5, sxtw]
        cmp     w0, w3
        bgt     .L12
        add     w7, w7, 1
        cmp     w0, w7
        bgt     .L10
.L9:
        ret
```

然后对于x86-64指令集来说，如果禁掉ivopts pass的话（编译参数 `-O2 -fno-ivopts`），循环部分的指令数signed版反而多了一条 `cdqe` 指令。经过查资料，发现这是因为x86-64指令集规定，做32位数值运算时，32位的结果是zero-extended到64位存储到寄存器中的，当需要符号扩展的时候就需要多使用一条 `cdqe` 指令（[在线地址](https://godbolt.org/z/MYndav5x6)）：

```asm
matrix_add_const_unsigned:
        test    edi, edi
        je      .L1
        xor     r9d, r9d
.L3:
        mov     r8d, edi
        xor     eax, eax
        imul    r8d, r9d
.L4:
        lea     ecx, [r8+rax]
        add     eax, 1
        add     BYTE PTR [rsi+rcx], dl
        cmp     eax, edi
        jb      .L4
        add     r9d, 1
        cmp     r9d, edi
        jb      .L3
.L1:
        ret

matrix_add_const_signed:
        test    edi, edi
        jle     .L10
        xor     r9d, r9d
.L12:
        mov     r8d, edi
        xor     ecx, ecx
        imul    r8d, r9d
.L13:
        lea     eax, [r8+rcx]
        add     ecx, 1
        cdqe
        add     BYTE PTR [rsi+rax], dl
        cmp     edi, ecx
        jg      .L13
        add     r9d, 1
        cmp     edi, r9d
        jg      .L12
.L10:
        ret
```

## 总结

综上，不同的指令集表现完全不同。对于RV64来说，当程序存在小精度转成大精度的情况时，小精度数值使用有符号数相比无符号指令数会更少。
