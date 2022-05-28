# AArch64

- [ISA相关内容搜索](https://developer.arm.com/search)
- [ARM C Language Extensions for SVE](https://developer.arm.com/documentation/100987/0000/)
  - [Using SVE intrinsics directly in your C code](https://developer.arm.com/documentation/100891/0612/coding-considerations/using-sve-intrinsics-directly-in-your-c-code)

## Registers

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
