# RISC-V

## Data Representation

- all things can be encoded by binary. A single bit is either 0 or 1. It is insanely powerful with:
  - Boolean algebra: AND, OR, NOT
  - Information theory: how to encode data
- encode data(example with 1 byte)
  - unsigned integers:
    ```
    base 2      base 10   base 16
    0000 0000 = 0       = 00
    0000 0001 = 1       = 01
    0000 0001 = 2       = 02
    ...
    1111 1101 = 253     = FD
    1111 1110 = 254     = FE
    1111 1111 = 255     = FF
    ```
  - signed integers (Tow's complement):
    ```
    base 2      base 10   base 16
    0000 0000 = 0       = 00
    0000 0001 = 1       = 01
    0000 0001 = 2       = 02
    ...
    0111 1110 = 126     = 7E
    0111 1111 = 127     = 7F
    1000 0000 = -128    = 80
    1000 0001 = -127    = 81
    ...
    1111 1101 = -3      = FD
    1111 1110 = -2      = FE
    1111 1111 = -1      = FF
    ```
    - -n = NOT(n) + 1
  - bianry and hexadecimal
    ```
    base 2   base 16
    0000   = 0
    0001   = 1
    ...
    1001   = 9
    1010   = A
    1011   = B
    1100   = C
    1101   = D
    1110   = E
    1111   = F
    ```