# 各种有意思的汇编片段

### 饱和左移 ###
#   e.g. rvv中对vl进行翻倍
#   如果移位之后小于源操作数，则t2为1，然后取反将其转化为-1，也就是所有位全为1
#   然后再or上t2，表示如果没有溢出，则为t2，溢出了全部置为1（即最大）

slli   t1, a0, 1
sltu   t2, t1, a0
sub    t2, zero, t2
or     t1, t1, t2


### 取最小值 ###
#   e.g. min(a,b) 正常使用分支指令，如下：
#       bgt a, b, .L1
#       mv c, a
#       j .L2
#     .L1:
#       mv c, b
#     .L2
#       ...
#
#   下面的解法，没有分支，不过指令会多一些

slt   t1, a, b
sub   t2, zero, t1 # 当a<b时，t2全为1，否则，t2全为0
and   a, a, t2
xori  t3, t2, -1 # 当a<b时，t3全为0，否则，t3全为1
and   b, b, t3
or    c, a, d
