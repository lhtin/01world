# ARM Note

## ARM32

### ABI

- [官方文档](https://github.com/ARM-software/abi-aa/blob/60a8eb8c55e999d74dac5e368fc9d7e36e38dda4/aapcs32/aapcs32.rst#the-base-procedure-call-standard)

#### APCS register names and usage

|Register|APCS name|APCS role                                        |
|--------|---------|-------------------------------------------------|
|r0      |a1       |argument 1/scratch register/result               |
|r1      |a2       |argument 2/scratch register/result               |
|r2      |a3       |argument 3/scratch register/result               |
|r3      |a4       |argument 4/scratch register/result               |
|r4      |v1       |register variable                                |
|r5      |v2       |register variable                                |
|r6      |v3       |register variable                                |
|r7      |v4       |register variable                                |
|r8      |v5       |register variable                                |
|r9      |sb/v6    |static base/register variable                    |
|r10     |sl/v7    |stack limit/stack chunk handle/register variable |
|r11     |fp/v8    |frame pointer/register variable                  |
|r12     |ip       |scratch register/new -sb in inter-link-unit calls|
|r13     |sp       |lower end of the current stack frame             |
|r14     |lr       |link register/scratch register                   |
|r15     |pc       |program counter                                  |


#### VFP registers

|Singles|Doubles|Quads   |Volatile?   |Role                                |
|-------|-------|--------|------------|------------------------------------|
|s0-s3  |d0-d1  |q0      |Volatile    |Parameters, result, scratch register|
|s4-s7  |d2-d3  |q1      |Volatile    |Parameters, scratch register        |
|s8-s11 |d4-d5  |q2      |Volatile    |Parameters, scratch register        |
|s12-s15|d6-d7  |q3      |Volatile    |Parameters, scratch register        |
|s16-s19|d8-d9  |q4      |Non-volatile|                                    |
|s20-s23|d10-d11|q5      |Non-volatile|                                    |
|s24-s27|d12-d13|q6      |Non-volatile|                                    |
|s28-s31|d14-d15|q7      |Non-volatile|                                    |
|       |d16-d31|q8-q15  |Volatile    |                                    |

## ARM64

- [ISA相关内容搜索](https://developer.arm.com/search)
- [ARM C Language Extensions for SVE](https://developer.arm.com/documentation/100987/0000/)
  - [Using SVE intrinsics directly in your C code](https://developer.arm.com/documentation/100891/0612/coding-considerations/using-sve-intrinsics-directly-in-your-c-code)

### Registers

- [ABI](https://github.com/ARM-software/abi-aa/blob/main/aapcs64/aapcs64.rst#machine-registers)
- [Overview of ARM64 ABI conventions](https://docs.microsoft.com/en-us/cpp/build/arm64-windows-abi-conventions)
  
  ![image](https://user-images.githubusercontent.com/13173904/170613093-0b10a7d4-c090-4e21-840d-e0a7bf1b41df.png)
- Integer Registers:
  - 32 64 bits: X0~X31
  - 32 32 bits: W0~W31
  ![image](https://user-images.githubusercontent.com/13173904/148150417-ec96a2d0-39d0-4931-9583-550a2726a8e3.png)
- Float Point and Vector Registers(Neon):
  - 32 8 bits: B0~B31
  - 32 16 bits: H0~H31
  - 32 32 bits: S0~S31
  - 32 64 bits: D0~D31
  - 32 128 bits: Q0~Q31
  ![image](https://user-images.githubusercontent.com/13173904/148150466-69f0c81a-a939-4d7f-a0c7-7f51a4013488.png)
- SVE Registers
  - 32 VL bits(128\~2048 bits) data register: Z0\~Z31 
  - 16 VL/8 bits mask register: P0~P15
  - FFR(1 First Faulting Register)
