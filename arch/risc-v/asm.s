 
# 饱和左移
#   e.g. rvv中对vl进行翻倍
#   如果移位之后小于源操作数，则t2为1，然后取反将其转化为-1，也就是所有位全为1
#   然后再or上t2，表示如果没有溢出，则为t2，溢出了全部置为1（即最大）
slli   t1, a0, 1
sltu   t2, t1, a0
sub    t2, zero, t2
or     t1, t1, t2
 
# 取最小值
#   e.g. min(a,b) 正常使用分支指令，如下：
#       bgt a, b, .L1
#       mv c, a
#       j .L2
#     .L1:
#       mv c, b
#     .L2
#       ...
slt   t1, a, b
and   c, a, t1
xori  t2, t1, -1
and   d, b, t2
or    c, c, d
