# RISC-V V Extension Instruction Set Listings

## 6. Configuration-Setting Instructions (vsetvli/vsetivli/vsetvl)

    vsetvli rd, rs1, vtypei # rd = new vl, rs1 = AVL, vtypei = new vtype setting
    vsetivli rd, uimm, vtypei # rd = new vl, uimm = AVL, vtypei = new vtype setting
    vsetvl rd, rs1, rs2 # rd = new vl, rs1 = AVL, rs2 = new vtype value


## 7. Vector Loads and Stores

### 7.4. Vector Unit-Stride Instructions

    # Vector unit-stride loads and stores

    # vd destination, rs1 base address, vm is mask encoding (v0.t or <missing>)
    vle8.v    vd, (rs1), vm  #    8-bit unit-stride load
    vle16.v   vd, (rs1), vm  #   16-bit unit-stride load
    vle32.v   vd, (rs1), vm  #   32-bit unit-stride load
    vle64.v   vd, (rs1), vm  #   64-bit unit-stride load

    # vs3 store data, rs1 base address, vm is mask encoding (v0.t or <missing>)
    vse8.v    vs3, (rs1), vm  #    8-bit unit-stride store
    vse16.v   vs3, (rs1), vm  #   16-bit unit-stride store
    vse32.v   vs3, (rs1), vm  #   32-bit unit-stride store
    vse64.v   vs3, (rs1), vm  #   64-bit unit-stride store

    # vlm.v and vsm.v always use tail-agnostic policy

    # Vector unit-stride mask load
    vlm.v vd, (rs1)   #  Load byte vector of length ceil(vl/8)

    # Vector unit-stride mask store
    vsm.v vs3, (rs1)  #  Store byte vector of length ceil(vl/8)

### 7.5. Vector Strided Instructions

    # Vector strided loads and stores

    # vd destination, rs1 base address, rs2 byte stride
    vlse8.v    vd, (rs1), rs2, vm  #    8-bit strided load
    vlse16.v   vd, (rs1), rs2, vm  #   16-bit strided load
    vlse32.v   vd, (rs1), rs2, vm  #   32-bit strided load
    vlse64.v   vd, (rs1), rs2, vm  #   64-bit strided load

    # vs3 store data, rs1 base address, rs2 byte stride
    vsse8.v    vs3, (rs1), rs2, vm  #    8-bit strided store
    vsse16.v   vs3, (rs1), rs2, vm  #   16-bit strided store
    vsse32.v   vs3, (rs1), rs2, vm  #   32-bit strided store
    vsse64.v   vs3, (rs1), rs2, vm  #   64-bit strided store

### 7.6. Vector Indexed Instructions

    # Vector indexed loads and stores

    # Vector indexed-unordered load instructions
    # vd destination, rs1 base address, vs2 byte offsets
    vluxei8.v    vd, (rs1), vs2, vm  # unordered  8-bit indexed load of SEW data
    vluxei16.v   vd, (rs1), vs2, vm  # unordered 16-bit indexed load of SEW data
    vluxei32.v   vd, (rs1), vs2, vm  # unordered 32-bit indexed load of SEW data
    vluxei64.v   vd, (rs1), vs2, vm  # unordered 64-bit indexed load of SEW data

    # Vector indexed-ordered load instructions
    # vd destination, rs1 base address, vs2 byte offsets
    vloxei8.v    vd, (rs1), vs2, vm  # ordered  8-bit indexed load of SEW data
    vloxei16.v   vd, (rs1), vs2, vm  # ordered 16-bit indexed load of SEW data
    vloxei32.v   vd, (rs1), vs2, vm  # ordered 32-bit indexed load of SEW data
    vloxei64.v   vd, (rs1), vs2, vm  # ordered 64-bit indexed load of SEW data

    # Vector indexed-unordered store instructions
    # vs3 store data, rs1 base address, vs2 byte offsets
    vsuxei8.v   vs3, (rs1), vs2, vm # unordered  8-bit indexed store of SEW data
    vsuxei16.v  vs3, (rs1), vs2, vm # unordered 16-bit indexed store of SEW data
    vsuxei32.v  vs3, (rs1), vs2, vm # unordered 32-bit indexed store of SEW data
    vsuxei64.v  vs3, (rs1), vs2, vm # unordered 64-bit indexed store of SEW data

    # Vector indexed-ordered store instructions
    # vs3 store data, rs1 base address, vs2 byte offsets
    vsoxei8.v    vs3, (rs1), vs2, vm  # ordered  8-bit indexed store of SEW data
    vsoxei16.v   vs3, (rs1), vs2, vm  # ordered 16-bit indexed store of SEW data
    vsoxei32.v   vs3, (rs1), vs2, vm  # ordered 32-bit indexed store of SEW data
    vsoxei64.v   vs3, (rs1), vs2, vm  # ordered 64-bit indexed store of SEW data

### 7.7. Unit-stride Fault-Only-First Loads

    # Vector unit-stride fault-only-first loads

    # vd destination, rs1 base address, vm is mask encoding (v0.t or <missing>)
    vle8ff.v    vd, (rs1), vm  #    8-bit unit-stride fault-only-first load
    vle16ff.v   vd, (rs1), vm  #   16-bit unit-stride fault-only-first load
    vle32ff.v   vd, (rs1), vm  #   32-bit unit-stride fault-only-first load
    vle64ff.v   vd, (rs1), vm  #   64-bit unit-stride fault-only-first load

### 7.8. Vector Load/Store Segment Instructions

#### 7.8.1. Vector Unit-Stride Segment Loads and Stores

    # Format
    # nf = 1, 2, 3, 4, 5, 6, 7, 8
    # eew = 8, 16, 32, 64
    # nf * EMUL <= 8 
    vlseg<nf>e<eew>.v vd, (rs1), vm      # Unit-stride segment load template
    vsseg<nf>e<eew>.v vs3, (rs1), vm     # Unit-stride segment store template

    # Examples
    vlseg8e8.v vd, (rs1), vm   # Load eight vector registers with eight byte fields.

    vsseg3e32.v vs3, (rs1), vm  # Store packed vector of 3*4-byte segments from vs3,vs3+1,vs3+2 to memory

    # Example 1
    # Memory structure holds packed RGB pixels (24-bit data structure, 8bpp)
    vsetvli a1, t0, e8, ta, ma
    vlseg3e8.v v8, (a0), vm
    # v8 holds the red pixels
    # v9 holds the green pixels
    # v10 holds the blue pixels

    # Example 2
    # Memory structure holds complex values, 32b for real and 32b for imaginary
    vsetvli a1, t0, e32, ta, ma
    vlseg2e32.v v8, (a0), vm
    # v8 holds real
    # v9 holds imaginary

    # Template for vector fault-only-first unit-stride segment loads.
    vlseg<nf>e<eew>ff.v vd, (rs1),  vm    # Unit-stride fault-only-first segment loads

#### 7.8.2. Vector Strided Segment Loads and Stores

    # Format
    vlsseg<nf>e<eew>.v vd, (rs1), rs2, vm          # Strided segment loads
    vssseg<nf>e<eew>.v vs3, (rs1), rs2, vm         # Strided segment stores

    # Examples
    vsetvli a1, t0, e8, ta, ma
    vlsseg3e8.v v4, (x5), x6   # Load bytes at addresses x5+i*x6   into v4[i],
                               #  and bytes at addresses x5+i*x6+1 into v5[i],
                               #  and bytes at addresses x5+i*x6+2 into v6[i].

    # Examples
    vsetvli a1, t0, e32, ta, ma
    vssseg2e32.v v2, (x5), x6   # Store words from v2[i] to address x5+i*x6
                                #   and words from v3[i] to address x5+i*x6+4

#### 7.8.3. Vector Indexed Segment Loads and Stores

    # Format
    vluxseg<nf>ei<eew>.v vd, (rs1), vs2, vm   # Indexed-unordered segment loads
    vloxseg<nf>ei<eew>.v vd, (rs1), vs2, vm   # Indexed-ordered segment loads
    vsuxseg<nf>ei<eew>.v vs3, (rs1), vs2, vm  # Indexed-unordered segment stores
    vsoxseg<nf>ei<eew>.v vs3, (rs1), vs2, vm  # Indexed-ordered segment stores

    # Examples
    vsetvli a1, t0, e8, ta, ma
    vluxseg3ei32.v v4, (x5), v3   # Load bytes at addresses x5+v3[i]   into v4[i],
                                  # and bytes at addresses x5+v3[i]+1 into v5[i],
                                  # and bytes at addresses x5+v3[i]+2 into v6[i].

    # Examples
    vsetvli a1, t0, e32, ta, ma
    vsuxseg2ei32.v v2, (x5), v5   # Store words from v2[i] to address x5+v5[i]
                                  # and words from v3[i] to address x5+v5[i]+4

### 7.9. Vector Load/Store Whole Register Instructions

    # Format of whole register load and store instructions.
    vl1r.v v3, (a0)       # Pseudoinstruction equal to vl1re8.v
    vl1re8.v    v3, (a0)  # Load v3 with VLEN/8 bytes held at address in a0
    vl1re16.v   v3, (a0)  # Load v3 with VLEN/16 halfwords held at address in a0
    vl1re32.v   v3, (a0)  # Load v3 with VLEN/32 words held at address in a0
    vl1re64.v   v3, (a0)  # Load v3 with VLEN/64 doublewords held at address in a0

    vl2r.v v2, (a0)       # Pseudoinstruction equal to vl2re8.v v2, (a0)
    vl2re8.v    v2, (a0)  # Load v2-v3 with 2*VLEN/8 bytes from address in a0
    vl2re16.v   v2, (a0)  # Load v2-v3 with 2*VLEN/16 halfwords held at address in a0
    vl2re32.v   v2, (a0)  # Load v2-v3 with 2*VLEN/32 words held at address in a0
    vl2re64.v   v2, (a0)  # Load v2-v3 with 2*VLEN/64 doublewords held at address in a0

    vl4r.v v4, (a0)       # Pseudoinstruction equal to vl4re8.v
    vl4re8.v    v4, (a0)  # Load v4-v7 with 4*VLEN/8 bytes from address in a0
    vl4re16.v   v4, (a0)
    vl4re32.v   v4, (a0)
    vl4re64.v   v4, (a0)

    vl8r.v v8, (a0)       # Pseudoinstruction equal to vl8re8.v
    vl8re8.v    v8, (a0)  # Load v8-v15 with 8*VLEN/8 bytes from address in a0
    vl8re16.v   v8, (a0)
    vl8re32.v   v8, (a0)
    vl8re64.v   v8, (a0)

    vs1r.v v3, (a1)      # Store v3 to address in a1
    vs2r.v v2, (a1)      # Store v2-v3 to address in a1
    vs4r.v v4, (a1)      # Store v4-v7 to address in a1
    vs8r.v v8, (a1)      # Store v8-v15 to address in a1

## 11. Vector Integer Arithmetic Instructions

### 11.1. Vector Single-Width Integer Add and Subtract

    # Integer adds.
    vadd.vv vd, vs2, vs1, vm   # Vector-vector
    vadd.vx vd, vs2, rs1, vm   # vector-scalar
    vadd.vi vd, vs2, imm, vm   # vector-immediate

    # Integer subtract
    vsub.vv vd, vs2, vs1, vm   # Vector-vector
    vsub.vx vd, vs2, rs1, vm   # vector-scalar

    # Integer reverse subtract
    vrsub.vx vd, vs2, rs1, vm   # vd[i] = x[rs1] - vs2[i]
    vrsub.vi vd, vs2, imm, vm   # vd[i] = imm - vs2[i]

    vneg.v vd, vs # Pseudoinstruction equal to vrsub.vx vd, vs, x0

### 11.2. Vector Widening Integer Add/Subtract

    # Widening unsigned integer add/subtract, 2*SEW = SEW +/- SEW
    vwaddu.vv  vd, vs2, vs1, vm  # vector-vector
    vwaddu.vx  vd, vs2, rs1, vm  # vector-scalar
    vwsubu.vv  vd, vs2, vs1, vm  # vector-vector
    vwsubu.vx  vd, vs2, rs1, vm  # vector-scalar

    # Widening signed integer add/subtract, 2*SEW = SEW +/- SEW
    vwadd.vv  vd, vs2, vs1, vm  # vector-vector
    vwadd.vx  vd, vs2, rs1, vm  # vector-scalar
    vwsub.vv  vd, vs2, vs1, vm  # vector-vector
    vwsub.vx  vd, vs2, rs1, vm  # vector-scalar

    # Widening unsigned integer add/subtract, 2*SEW = 2*SEW +/- SEW
    vwaddu.wv  vd, vs2, vs1, vm  # vector-vector
    vwaddu.wx  vd, vs2, rs1, vm  # vector-scalar
    vwsubu.wv  vd, vs2, vs1, vm  # vector-vector
    vwsubu.wx  vd, vs2, rs1, vm  # vector-scalar

    # Widening signed integer add/subtract, 2*SEW = 2*SEW +/- SEW
    vwadd.wv  vd, vs2, vs1, vm  # vector-vector
    vwadd.wx  vd, vs2, rs1, vm  # vector-scalar
    vwsub.wv  vd, vs2, vs1, vm  # vector-vector
    vwsub.wx  vd, vs2, rs1, vm  # vector-scalar

    vwcvt.x.x.v vd, vs, vm # Pseudoinstruction equal to vwadd.vx vd, vs, x0, vm
    vwcvtu.x.x.v vd, vs, vm # Pseudoinstruction equal to vwaddu.vx vd, vs, x0, vm

### 11.3. Vector Integer Extension

    vzext.vf2 vd, vs2, vm  # Zero-extend SEW/2 source to SEW destination
    vsext.vf2 vd, vs2, vm  # Sign-extend SEW/2 source to SEW destination
    vzext.vf4 vd, vs2, vm  # Zero-extend SEW/4 source to SEW destination
    vsext.vf4 vd, vs2, vm  # Sign-extend SEW/4 source to SEW destination
    vzext.vf8 vd, vs2, vm  # Zero-extend SEW/8 source to SEW destination
    vsext.vf8 vd, vs2, vm  # Sign-extend SEW/8 source to SEW destination

### 11.4. Vector Integer Add-with-Carry / Subtract-with-Borrow Instructions


    # Produce sum with carry.

    # vd[i] = vs2[i] + vs1[i] + v0.mask[i]
    vadc.vvm   vd, vs2, vs1, v0  # Vector-vector

    # vd[i] = vs2[i] + x[rs1] + v0.mask[i]
    vadc.vxm   vd, vs2, rs1, v0  # Vector-scalar

    # vd[i] = vs2[i] + imm + v0.mask[i]
    vadc.vim   vd, vs2, imm, v0  # Vector-immediate

    # Produce carry out in mask register format

    # vd.mask[i] = carry_out(vs2[i] + vs1[i] + v0.mask[i])
    vmadc.vvm   vd, vs2, vs1, v0  # Vector-vector

    # vd.mask[i] = carry_out(vs2[i] + x[rs1] + v0.mask[i])
    vmadc.vxm   vd, vs2, rs1, v0  # Vector-scalar

    # vd.mask[i] = carry_out(vs2[i] + imm + v0.mask[i])
    vmadc.vim   vd, vs2, imm, v0  # Vector-immediate

    # vd.mask[i] = carry_out(vs2[i] + vs1[i])
    vmadc.vv    vd, vs2, vs1      # Vector-vector, no carry-in

    # vd.mask[i] = carry_out(vs2[i] + x[rs1])
    vmadc.vx    vd, vs2, rs1      # Vector-scalar, no carry-in

    # vd.mask[i] = carry_out(vs2[i] + imm)
    vmadc.vi    vd, vs2, imm      # Vector-immediate, no carry-in

    # Example multi-word arithmetic sequence, accumulating into v4
    vmadc.vvm v1, v4, v8, v0 # Get carry into temp register v1
    vadc.vvm v4, v4, v8, v0 # Calc new sum
    vmmv.m v0, v1 # Move temp carry into v0 for next word

    # Produce difference with borrow.

    # vd[i] = vs2[i] - vs1[i] - v0.mask[i]
    vsbc.vvm   vd, vs2, vs1, v0  # Vector-vector

    # vd[i] = vs2[i] - x[rs1] - v0.mask[i]
    vsbc.vxm   vd, vs2, rs1, v0  # Vector-scalar

    # Produce borrow out in mask register format

    # vd.mask[i] = borrow_out(vs2[i] - vs1[i] - v0.mask[i])
    vmsbc.vvm   vd, vs2, vs1, v0  # Vector-vector

    # vd.mask[i] = borrow_out(vs2[i] - x[rs1] - v0.mask[i])
    vmsbc.vxm   vd, vs2, rs1, v0  # Vector-scalar

    # vd.mask[i] = borrow_out(vs2[i] - vs1[i])
    vmsbc.vv    vd, vs2, vs1      # Vector-vector, no borrow-in

    # vd.mask[i] = borrow_out(vs2[i] - x[rs1])
    vmsbc.vx    vd, vs2, rs1      # Vector-scalar, no borrow-in

### 11.5. Vector Bitwise Logical Instructions

    # Bitwise logical operations.
    vand.vv vd, vs2, vs1, vm   # Vector-vector
    vand.vx vd, vs2, rs1, vm   # vector-scalar
    vand.vi vd, vs2, imm, vm   # vector-immediate

    vor.vv vd, vs2, vs1, vm    # Vector-vector
    vor.vx vd, vs2, rs1, vm    # vector-scalar
    vor.vi vd, vs2, imm, vm    # vector-immediate

    vxor.vv vd, vs2, vs1, vm    # Vector-vector
    vxor.vx vd, vs2, rs1, vm    # vector-scalar
    vxor.vi vd, vs2, imm, vm    # vector-immediate

    vnot.v vd, vs, vm = vxor.vi vd, vs, -1, vm

### 11.6. Vector Single-Width Shift Instructions

    # Bit shift operations
    vsll.vv vd, vs2, vs1, vm   # Vector-vector
    vsll.vx vd, vs2, rs1, vm   # vector-scalar
    vsll.vi vd, vs2, uimm, vm   # vector-immediate

    vsrl.vv vd, vs2, vs1, vm   # Vector-vector
    vsrl.vx vd, vs2, rs1, vm   # vector-scalar
    vsrl.vi vd, vs2, uimm, vm   # vector-immediate

    vsra.vv vd, vs2, vs1, vm   # Vector-vector
    vsra.vx vd, vs2, rs1, vm   # vector-scalar
    vsra.vi vd, vs2, uimm, vm   # vector-immediate

### 11.7. Vector Narrowing Integer Right Shift Instructions

    # Narrowing shift right logical, SEW = (2*SEW) >> SEW
    vnsrl.wv vd, vs2, vs1, vm   # vector-vector
    vnsrl.wx vd, vs2, rs1, vm   # vector-scalar
    vnsrl.wi vd, vs2, uimm, vm   # vector-immediate

    # Narrowing shift right arithmetic, SEW = (2*SEW) >> SEW
    vnsra.wv vd, vs2, vs1, vm   # vector-vector
    vnsra.wx vd, vs2, rs1, vm   # vector-scalar
    vnsra.wi vd, vs2, uimm, vm   # vector-immediate

    vncvt.x.x.w vd, vs, vm = vnsrl.wx vd, vs, x0, vm

### 11.8. Vector Integer Compare Instructions

    # Set if equal
    vmseq.vv vd, vs2, vs1, vm  # Vector-vector
    vmseq.vx vd, vs2, rs1, vm  # vector-scalar
    vmseq.vi vd, vs2, imm, vm  # vector-immediate

    # Set if not equal
    vmsne.vv vd, vs2, vs1, vm  # Vector-vector
    vmsne.vx vd, vs2, rs1, vm  # vector-scalar
    vmsne.vi vd, vs2, imm, vm  # vector-immediate

    # Set if less than, unsigned
    vmsltu.vv vd, vs2, vs1, vm  # Vector-vector
    vmsltu.vx vd, vs2, rs1, vm  # Vector-scalar

    # Set if less than, signed
    vmslt.vv vd, vs2, vs1, vm  # Vector-vector
    vmslt.vx vd, vs2, rs1, vm  # vector-scalar

    # Set if less than or equal, unsigned
    vmsleu.vv vd, vs2, vs1, vm   # Vector-vector
    vmsleu.vx vd, vs2, rs1, vm   # vector-scalar
    vmsleu.vi vd, vs2, imm, vm   # Vector-immediate

    # Set if less than or equal, signed
    vmsle.vv vd, vs2, vs1, vm  # Vector-vector
    vmsle.vx vd, vs2, rs1, vm  # vector-scalar
    vmsle.vi vd, vs2, imm, vm  # vector-immediate

    # Set if greater than, unsigned
    vmsgtu.vx vd, vs2, rs1, vm   # Vector-scalar
    vmsgtu.vi vd, vs2, imm, vm   # Vector-immediate

    # Set if greater than, signed
    vmsgt.vx vd, vs2, rs1, vm    # Vector-scalar
    vmsgt.vi vd, vs2, imm, vm    # Vector-immediate

    # Following two instructions are not provided directly
    # Set if greater than or equal, unsigned
    # vmsgeu.vx vd, vs2, rs1, vm    # Vector-scalar
    # Set if greater than or equal, signed
    # vmsge.vx vd, vs2, rs1, vm    # Vector-scalar

    Comparison      Assembler Mapping             Assembler Pseudoinstruction

    va < vb         vmslt{u}.vv vd, va, vb, vm
    va <= vb        vmsle{u}.vv vd, va, vb, vm
    va > vb         vmslt{u}.vv vd, vb, va, vm    vmsgt{u}.vv vd, va, vb, vm
    va >= vb        vmsle{u}.vv vd, vb, va, vm    vmsge{u}.vv vd, va, vb, vm

    va < x          vmslt{u}.vx vd, va, x, vm
    va <= x         vmsle{u}.vx vd, va, x, vm
    va > x          vmsgt{u}.vx vd, va, x, vm
    va >= x         see below

    va < i          vmsle{u}.vi vd, va, i-1, vm    vmslt{u}.vi vd, va, i, vm
    va <= i         vmsle{u}.vi vd, va, i, vm
    va > i          vmsgt{u}.vi vd, va, i, vm
    va >= i         vmsgt{u}.vi vd, va, i-1, vm    vmsge{u}.vi vd, va, i, vm

    va, vb vector register groups
    x      scalar integer register
    i      immediate

    Sequences to synthesize `vmsge{u}.vx` instruction

    va >= x,  x > minimum

      addi t0, x, -1; vmsgt{u}.vx vd, va, t0, vm

    unmasked va >= x

      pseudoinstruction: vmsge{u}.vx vd, va, x
      expansion: vmslt{u}.vx vd, va, x; vmnand.mm vd, vd, vd

    masked va >= x, vd != v0

      pseudoinstruction: vmsge{u}.vx vd, va, x, v0.t
      expansion: vmslt{u}.vx vd, va, x, v0.t; vmxor.mm vd, vd, v0

    masked va >= x, vd == v0

      pseudoinstruction: vmsge{u}.vx vd, va, x, v0.t, vt
      expansion: vmslt{u}.vx vt, va, x;  vmandn.mm vd, vd, vt

    masked va >= x, any vd

      pseudoinstruction: vmsge{u}.vx vd, va, x, v0.t, vt
      expansion: vmslt{u}.vx vt, va, x;  vmandn.mm vt, v0, vt;  vmandn.mm vd, vd, v0;  vmor.mm vd, vt, vd

      The vt argument to the pseudoinstruction must name a temporary vector register that is
      not same as vd and which will be clobbered by the pseudoinstruction

### 11.9. Vector Integer Min/Max Instructions

    # Unsigned minimum
    vminu.vv vd, vs2, vs1, vm   # Vector-vector
    vminu.vx vd, vs2, rs1, vm   # vector-scalar

    # Signed minimum
    vmin.vv vd, vs2, vs1, vm   # Vector-vector
    vmin.vx vd, vs2, rs1, vm   # vector-scalar

    # Unsigned maximum
    vmaxu.vv vd, vs2, vs1, vm   # Vector-vector
    vmaxu.vx vd, vs2, rs1, vm   # vector-scalar

    # Signed maximum
    vmax.vv vd, vs2, vs1, vm   # Vector-vector
    vmax.vx vd, vs2, rs1, vm   # vector-scalar

### 11.10. Vector Single-Width Integer Multiply Instructions

    # Signed multiply, returning low bits of product
    vmul.vv vd, vs2, vs1, vm   # Vector-vector
    vmul.vx vd, vs2, rs1, vm   # vector-scalar

    # Signed multiply, returning high bits of product
    vmulh.vv vd, vs2, vs1, vm   # Vector-vector
    vmulh.vx vd, vs2, rs1, vm   # vector-scalar

    # Unsigned multiply, returning high bits of product
    vmulhu.vv vd, vs2, vs1, vm   # Vector-vector
    vmulhu.vx vd, vs2, rs1, vm   # vector-scalar

    # Signed(vs2)-Unsigned multiply, returning high bits of product
    vmulhsu.vv vd, vs2, vs1, vm   # Vector-vector
    vmulhsu.vx vd, vs2, rs1, vm   # vector-scalar

### 11.11. Vector Integer Divide Instructions

    # Unsigned divide.
    vdivu.vv vd, vs2, vs1, vm   # Vector-vector
    vdivu.vx vd, vs2, rs1, vm   # vector-scalar

    # Signed divide
    vdiv.vv vd, vs2, vs1, vm   # Vector-vector
    vdiv.vx vd, vs2, rs1, vm   # vector-scalar

    # Unsigned remainder
    vremu.vv vd, vs2, vs1, vm   # Vector-vector
    vremu.vx vd, vs2, rs1, vm   # vector-scalar

    # Signed remainder
    vrem.vv vd, vs2, vs1, vm   # Vector-vector
    vrem.vx vd, vs2, rs1, vm   # vector-scalar

### 11.12. Vector Widening Integer Multiply Instructions

    # The widening integer multiply instructions return the
    # full 2*SEW-bit product from an SEW-bit*SEW-bit multiply

    # Widening signed-integer multiply
    vwmul.vv  vd, vs2, vs1, vm # vector-vector
    vwmul.vx  vd, vs2, rs1, vm # vector-scalar

    # Widening unsigned-integer multiply
    vwmulu.vv vd, vs2, vs1, vm # vector-vector
    vwmulu.vx vd, vs2, rs1, vm # vector-scalar

    # Widening signed(vs2)-unsigned integer multiply
    vwmulsu.vv vd, vs2, vs1, vm # vector-vector
    vwmulsu.vx vd, vs2, rs1, vm # vector-scalar

### 11.13. Vector Single-Width Integer Multiply-Add Instructions

    # Integer multiply-add, overwrite addend
    vmacc.vv vd, vs1, vs2, vm    # vd[i] = +(vs1[i] * vs2[i]) + vd[i]
    vmacc.vx vd, rs1, vs2, vm    # vd[i] = +(x[rs1] * vs2[i]) + vd[i]

    # Integer multiply-sub, overwrite minuend
    vnmsac.vv vd, vs1, vs2, vm    # vd[i] = -(vs1[i] * vs2[i]) + vd[i]
    vnmsac.vx vd, rs1, vs2, vm    # vd[i] = -(x[rs1] * vs2[i]) + vd[i]

    # Integer multiply-add, overwrite multiplicand
    vmadd.vv vd, vs1, vs2, vm    # vd[i] = (vs1[i] * vd[i]) + vs2[i]
    vmadd.vx vd, rs1, vs2, vm    # vd[i] = (x[rs1] * vd[i]) + vs2[i]

    # Integer multiply-sub, overwrite multiplicand
    vnmsub.vv vd, vs1, vs2, vm    # vd[i] = -(vs1[i] * vd[i]) + vs2[i]
    vnmsub.vx vd, rs1, vs2, vm    # vd[i] = -(x[rs1] * vd[i]) + vs2[i]

### 11.14. Vector Widening Integer Multiply-Add Instructions

    # The widening integer multiply-add instructions add the full 2*SEW-bit
    # product from a SEW-bit*SEW-bit multiply to a 2*SEW-bit value and produce
    # a 2*SEW-bit result. All combinations of signed and unsigned multiply
    # operands are supported.

    # Widening unsigned-integer multiply-add, overwrite addend
    vwmaccu.vv vd, vs1, vs2, vm    # vd[i] = +(vs1[i] * vs2[i]) + vd[i]
    vwmaccu.vx vd, rs1, vs2, vm    # vd[i] = +(x[rs1] * vs2[i]) + vd[i]

    # Widening signed-integer multiply-add, overwrite addend
    vwmacc.vv vd, vs1, vs2, vm    # vd[i] = +(vs1[i] * vs2[i]) + vd[i]
    vwmacc.vx vd, rs1, vs2, vm    # vd[i] = +(x[rs1] * vs2[i]) + vd[i]

    # Widening signed-unsigned-integer multiply-add, overwrite addend
    vwmaccsu.vv vd, vs1, vs2, vm  # vd[i] = +(signed(vs1[i]) * unsigned(vs2[i])) + vd[i]
    vwmaccsu.vx vd, rs1, vs2, vm  # vd[i] = +(signed(x[rs1]) * unsigned(vs2[i])) + vd[i]

    # Widening unsigned-signed-integer multiply-add, overwrite addend
    vwmaccus.vx vd, rs1, vs2, vm  # vd[i] = +(unsigned(x[rs1]) * signed(vs2[i])) + vd[i]

### 11.15. Vector Integer Merge Instructions

    vmerge.vvm vd, vs2, vs1, v0  # vd[i] = v0.mask[i] ? vs1[i] : vs2[i]
    vmerge.vxm vd, vs2, rs1, v0  # vd[i] = v0.mask[i] ? x[rs1] : vs2[i]
    vmerge.vim vd, vs2, imm, v0  # vd[i] = v0.mask[i] ? imm    : vs2[i]

### 11.16. Vector Integer Move Instructions

    vmv.v.v vd, vs1 # vd[i] = vs1[i]
    vmv.v.x vd, rs1 # vd[i] = x[rs1]
    vmv.v.i vd, imm # vd[i] = imm

    Mask values can be widened into SEW-width elements using a sequence vmv.v.i vd, 0; vmerge.vim vd, vd, 1, v0.

    The form vmv.v.v vd, vd, which leaves body elements unchanged, can be used to indicate that the register will next be used with an EEW equal to SEW.


## 12. Vector Fixed-Point Arithmetic Instructions

### 12.1. Vector Single-Width Saturating Add and Subtract

    # Saturating adds of unsigned integers.
    vsaddu.vv vd, vs2, vs1, vm   # Vector-vector
    vsaddu.vx vd, vs2, rs1, vm   # vector-scalar
    vsaddu.vi vd, vs2, imm, vm   # vector-immediate

    # Saturating adds of signed integers.
    vsadd.vv vd, vs2, vs1, vm   # Vector-vector
    vsadd.vx vd, vs2, rs1, vm   # vector-scalar
    vsadd.vi vd, vs2, imm, vm   # vector-immediate

    # Saturating subtract of unsigned integers.
    vssubu.vv vd, vs2, vs1, vm   # Vector-vector
    vssubu.vx vd, vs2, rs1, vm   # vector-scalar

    # Saturating subtract of signed integers.
    vssub.vv vd, vs2, vs1, vm   # Vector-vector
    vssub.vx vd, vs2, rs1, vm   # vector-scalar

### 12.2. Vector Single-Width Averaging Add and Subtract

    # Averaging add

    # Averaging adds of unsigned integers.
    vaaddu.vv vd, vs2, vs1, vm   # roundoff_unsigned(vs2[i] + vs1[i], 1)
    vaaddu.vx vd, vs2, rs1, vm   # roundoff_unsigned(vs2[i] + x[rs1], 1)

    # Averaging adds of signed integers.
    vaadd.vv vd, vs2, vs1, vm   # roundoff_signed(vs2[i] + vs1[i], 1)
    vaadd.vx vd, vs2, rs1, vm   # roundoff_signed(vs2[i] + x[rs1], 1)

    # Averaging subtract

    # Averaging subtract of unsigned integers.
    vasubu.vv vd, vs2, vs1, vm   # roundoff_unsigned(vs2[i] - vs1[i], 1)
    vasubu.vx vd, vs2, rs1, vm   # roundoff_unsigned(vs2[i] - x[rs1], 1)

    # Averaging subtract of signed integers.
    vasub.vv vd, vs2, vs1, vm   # roundoff_signed(vs2[i] - vs1[i], 1)
    vasub.vx vd, vs2, rs1, vm   # roundoff_signed(vs2[i] - x[rs1], 1)

### 12.3. Vector Single-Width Fractional Multiply with Rounding and Saturation

    # Signed saturating and rounding fractional multiply
    # See vxrm  description for rounding calculation
    vsmul.vv vd, vs2, vs1, vm  # vd[i] = clip(roundoff_signed(vs2[i]*vs1[i], SEW-1))
    vsmul.vx vd, vs2, rs1, vm  # vd[i] = clip(roundoff_signed(vs2[i]*x[rs1], SEW-1))

### 12.4. Vector Single-Width Scaling Shift Instructions

    # Scaling shift right logical
    vssrl.vv vd, vs2, vs1, vm   # vd[i] = roundoff_unsigned(vs2[i], vs1[i])
    vssrl.vx vd, vs2, rs1, vm   # vd[i] = roundoff_unsigned(vs2[i], x[rs1])
    vssrl.vi vd, vs2, uimm, vm  # vd[i] = roundoff_unsigned(vs2[i], uimm)

    # Scaling shift right arithmetic
    vssra.vv vd, vs2, vs1, vm   # vd[i] = roundoff_signed(vs2[i],vs1[i])
    vssra.vx vd, vs2, rs1, vm   # vd[i] = roundoff_signed(vs2[i], x[rs1])
    vssra.vi vd, vs2, uimm, vm  # vd[i] = roundoff_signed(vs2[i], uimm)

### 12.5. Vector Narrowing Fixed-Point Clip Instructions

    # Narrowing unsigned clip
    #                                SEW                            2*SEW   SEW
    vnclipu.wv vd, vs2, vs1, vm  # vd[i] = clip(roundoff_unsigned(vs2[i], vs1[i]))
    vnclipu.wx vd, vs2, rs1, vm  # vd[i] = clip(roundoff_unsigned(vs2[i], x[rs1]))
    vnclipu.wi vd, vs2, uimm, vm # vd[i] = clip(roundoff_unsigned(vs2[i], uimm))

    # Narrowing signed clip
    vnclip.wv vd, vs2, vs1, vm   # vd[i] = clip(roundoff_signed(vs2[i], vs1[i]))
    vnclip.wx vd, vs2, rs1, vm   # vd[i] = clip(roundoff_signed(vs2[i], x[rs1]))
    vnclip.wi vd, vs2, uimm, vm  # vd[i] = clip(roundoff_signed(vs2[i], uimm))


## 13. Vector Floating-Point Instructions

### 13.2. Vector Single-Width Floating-Point Add/Subtract Instructions

    # Floating-point add
    vfadd.vv vd, vs2, vs1, vm   # Vector-vector
    vfadd.vf vd, vs2, rs1, vm   # vector-scalar

    # Floating-point subtract
    vfsub.vv vd, vs2, vs1, vm   # Vector-vector
    vfsub.vf vd, vs2, rs1, vm   # Vector-scalar vd[i] = vs2[i] - f[rs1]
    vfrsub.vf vd, vs2, rs1, vm  # Scalar-vector vd[i] = f[rs1] - vs2[i]

### 13.3. Vector Widening Floating-Point Add/Subtract Instructions

    # Widening FP add/subtract, 2*SEW = SEW +/- SEW
    vfwadd.vv vd, vs2, vs1, vm  # vector-vector
    vfwadd.vf vd, vs2, rs1, vm  # vector-scalar
    vfwsub.vv vd, vs2, vs1, vm  # vector-vector
    vfwsub.vf vd, vs2, rs1, vm  # vector-scalar

    # Widening FP add/subtract, 2*SEW = 2*SEW +/- SEW
    vfwadd.wv  vd, vs2, vs1, vm  # vector-vector
    vfwadd.wf  vd, vs2, rs1, vm  # vector-scalar
    vfwsub.wv  vd, vs2, vs1, vm  # vector-vector
    vfwsub.wf  vd, vs2, rs1, vm  # vector-scalar

### 13.4. Vector Single-Width Floating-Point Multiply/Divide Instructions

    # Floating-point multiply
    vfmul.vv vd, vs2, vs1, vm   # Vector-vector
    vfmul.vf vd, vs2, rs1, vm   # vector-scalar

    # Floating-point divide
    vfdiv.vv vd, vs2, vs1, vm   # Vector-vector
    vfdiv.vf vd, vs2, rs1, vm   # vector-scalar

    # Reverse floating-point divide vector = scalar / vector
    vfrdiv.vf vd, vs2, rs1, vm  # scalar-vector, vd[i] = f[rs1]/vs2[i]

### 13.5. Vector Widening Floating-Point Multiply

    # Widening floating-point multiply
    vfwmul.vv    vd, vs2, vs1, vm # vector-vector
    vfwmul.vf    vd, vs2, rs1, vm # vector-scalar

### 13.6. Vector Single-Width Floating-Point Fused Multiply-Add Instructions

    # FP multiply-accumulate, overwrites addend
    vfmacc.vv vd, vs1, vs2, vm    # vd[i] = +(vs1[i] * vs2[i]) + vd[i]
    vfmacc.vf vd, rs1, vs2, vm    # vd[i] = +(f[rs1] * vs2[i]) + vd[i]

    # FP negate-(multiply-accumulate), overwrites subtrahend
    vfnmacc.vv vd, vs1, vs2, vm   # vd[i] = -(vs1[i] * vs2[i]) - vd[i]
    vfnmacc.vf vd, rs1, vs2, vm   # vd[i] = -(f[rs1] * vs2[i]) - vd[i]

    # FP multiply-subtract-accumulator, overwrites subtrahend
    vfmsac.vv vd, vs1, vs2, vm    # vd[i] = +(vs1[i] * vs2[i]) - vd[i]
    vfmsac.vf vd, rs1, vs2, vm    # vd[i] = +(f[rs1] * vs2[i]) - vd[i]

    # FP negate-(multiply-subtract-accumulator), overwrites minuend
    vfnmsac.vv vd, vs1, vs2, vm   # vd[i] = -(vs1[i] * vs2[i]) + vd[i]
    vfnmsac.vf vd, rs1, vs2, vm   # vd[i] = -(f[rs1] * vs2[i]) + vd[i]

    # FP multiply-add, overwrites multiplicand
    vfmadd.vv vd, vs1, vs2, vm    # vd[i] = +(vs1[i] * vd[i]) + vs2[i]
    vfmadd.vf vd, rs1, vs2, vm    # vd[i] = +(f[rs1] * vd[i]) + vs2[i]

    # FP negate-(multiply-add), overwrites multiplicand
    vfnmadd.vv vd, vs1, vs2, vm   # vd[i] = -(vs1[i] * vd[i]) - vs2[i]
    vfnmadd.vf vd, rs1, vs2, vm   # vd[i] = -(f[rs1] * vd[i]) - vs2[i]

    # FP multiply-sub, overwrites multiplicand
    vfmsub.vv vd, vs1, vs2, vm    # vd[i] = +(vs1[i] * vd[i]) - vs2[i]
    vfmsub.vf vd, rs1, vs2, vm    # vd[i] = +(f[rs1] * vd[i]) - vs2[i]

    # FP negate-(multiply-sub), overwrites multiplicand
    vfnmsub.vv vd, vs1, vs2, vm   # vd[i] = -(vs1[i] * vd[i]) + vs2[i]
    vfnmsub.vf vd, rs1, vs2, vm   # vd[i] = -(f[rs1] * vd[i]) + vs2[i]

### 13.7. Vector Widening Floating-Point Fused Multiply-Add Instructions

    # FP widening multiply-accumulate, overwrites addend
    vfwmacc.vv vd, vs1, vs2, vm    # vd[i] = +(vs1[i] * vs2[i]) + vd[i]
    vfwmacc.vf vd, rs1, vs2, vm    # vd[i] = +(f[rs1] * vs2[i]) + vd[i]

    # FP widening negate-(multiply-accumulate), overwrites addend
    vfwnmacc.vv vd, vs1, vs2, vm   # vd[i] = -(vs1[i] * vs2[i]) - vd[i]
    vfwnmacc.vf vd, rs1, vs2, vm   # vd[i] = -(f[rs1] * vs2[i]) - vd[i]

    # FP widening multiply-subtract-accumulator, overwrites addend
    vfwmsac.vv vd, vs1, vs2, vm    # vd[i] = +(vs1[i] * vs2[i]) - vd[i]
    vfwmsac.vf vd, rs1, vs2, vm    # vd[i] = +(f[rs1] * vs2[i]) - vd[i]

    # FP widening negate-(multiply-subtract-accumulator), overwrites addend
    vfwnmsac.vv vd, vs1, vs2, vm   # vd[i] = -(vs1[i] * vs2[i]) + vd[i]
    vfwnmsac.vf vd, rs1, vs2, vm   # vd[i] = -(f[rs1] * vs2[i]) + vd[i]

### 13.8. Vector Floating-Point Square-Root Instruction

    # Floating-point square root
    vfsqrt.v vd, vs2, vm   # Vector-vector square root

### 13.9. Vector Floating-Point Reciprocal Square-Root Estimate Instruction

    # Floating-point reciprocal square-root estimate to 7 bits.
    vfrsqrt7.v vd, vs2, vm

### 13.10. Vector Floating-Point Reciprocal Estimate Instruction

    # Floating-point reciprocal estimate to 7 bits.
    vfrec7.v vd, vs2, vm

### 13.11. Vector Floating-Point MIN/MAX Instructions

    # Floating-point minimum
    vfmin.vv vd, vs2, vs1, vm   # Vector-vector
    vfmin.vf vd, vs2, rs1, vm   # vector-scalar

    # Floating-point maximum
    vfmax.vv vd, vs2, vs1, vm   # Vector-vector
    vfmax.vf vd, vs2, rs1, vm   # vector-scalar

### 13.12. Vector Floating-Point Sign-Injection Instructions

    vfsgnj.vv vd, vs2, vs1, vm   # Vector-vector
    vfsgnj.vf vd, vs2, rs1, vm   # vector-scalar

    vfsgnjn.vv vd, vs2, vs1, vm  # Vector-vector
    vfsgnjn.vf vd, vs2, rs1, vm  # vector-scalar

    vfsgnjx.vv vd, vs2, vs1, vm  # Vector-vector
    vfsgnjx.vf vd, vs2, rs1, vm  # vector-scalar

    vfneg.v vd, vs = vfsgnjn.vv vd, vs, vs
    vfabs.v vd, vs = vfsgnjx.vv vd, vs, vs

### 13.13. Vector Floating-Point Compare Instructions

    # Compare equal
    vmfeq.vv vd, vs2, vs1, vm  # Vector-vector
    vmfeq.vf vd, vs2, rs1, vm  # vector-scalar

    # Compare not equal
    vmfne.vv vd, vs2, vs1, vm  # Vector-vector
    vmfne.vf vd, vs2, rs1, vm  # vector-scalar

    # Compare less than
    vmflt.vv vd, vs2, vs1, vm  # Vector-vector
    vmflt.vf vd, vs2, rs1, vm  # vector-scalar

    # Compare less than or equal
    vmfle.vv vd, vs2, vs1, vm  # Vector-vector
    vmfle.vf vd, vs2, rs1, vm  # vector-scalar

    # Compare greater than
    vmfgt.vf vd, vs2, rs1, vm  # vector-scalar

    # Compare greater than or equal
    vmfge.vf vd, vs2, rs1, vm  # vector-scalar

    Comparison      Assembler Mapping             Assembler pseudoinstruction

    va < vb         vmflt.vv vd, va, vb, vm
    va <= vb        vmfle.vv vd, va, vb, vm
    va > vb         vmflt.vv vd, vb, va, vm       vmfgt.vv vd, va, vb, vm
    va >= vb        vmfle.vv vd, vb, va, vm       vmfge.vv vd, va, vb, vm

    va < f          vmflt.vf vd, va, f, vm
    va <= f         vmfle.vf vd, va, f, vm
    va > f          vmfgt.vf vd, va, f, vm
    va >= f         vmfge.vf vd, va, f, vm

    va, vb vector register groups
    f      scalar floating-point register

    # Example of implementing isgreater()
    vmfeq.vv v0, va, va # Only set where A is not NaN.
    vmfeq.vv v1, vb, vb # Only set where B is not NaN.
    vmand.mm v0, v0, v1 # Only set where A and B are ordered,
    vmfgt.vv v0, va, vb, v0.t # so only set flags on ordered values.


### 13.14. Vector Floating-Point Classify Instruction

    vfclass.v vd, vs2, vm   # Vector-vector

### 13.15. Vector Floating-Point Merge Instruction

    vfmerge.vfm vd, vs2, rs1, v0  # vd[i] = v0.mask[i] ? f[rs1] : vs2[i]

### 13.16. Vector Floating-Point Move Instruction

    vfmv.v.f vd, rs1  # vd[i] = f[rs1]

### 13.17. Single-Width Floating-Point/Integer Type-Convert Instructions

    vfcvt.xu.f.v vd, vs2, vm       # Convert float to unsigned integer.
    vfcvt.x.f.v  vd, vs2, vm       # Convert float to signed integer.

    vfcvt.rtz.xu.f.v vd, vs2, vm   # Convert float to unsigned integer, truncating.
    vfcvt.rtz.x.f.v  vd, vs2, vm   # Convert float to signed integer, truncating.

    vfcvt.f.xu.v vd, vs2, vm       # Convert unsigned integer to float.
    vfcvt.f.x.v  vd, vs2, vm       # Convert signed integer to float.

### 13.18. Widening Floating-Point/Integer Type-Convert Instructions

    vfwcvt.xu.f.v vd, vs2, vm       # Convert float to double-width unsigned integer.
    vfwcvt.x.f.v  vd, vs2, vm       # Convert float to double-width signed integer.

    vfwcvt.rtz.xu.f.v vd, vs2, vm   # Convert float to double-width unsigned integer, truncating.
    vfwcvt.rtz.x.f.v  vd, vs2, vm   # Convert float to double-width signed integer, truncating.

    vfwcvt.f.xu.v vd, vs2, vm       # Convert unsigned integer to double-width float.
    vfwcvt.f.x.v  vd, vs2, vm       # Convert signed integer to double-width float.

    vfwcvt.f.f.v vd, vs2, vm        # Convert single-width float to double-width float.

### 13.19. Narrowing Floating-Point/Integer Type-Convert Instructions

    vfncvt.xu.f.w vd, vs2, vm       # Convert double-width float to unsigned integer.
    vfncvt.x.f.w  vd, vs2, vm       # Convert double-width float to signed integer.

    vfncvt.rtz.xu.f.w vd, vs2, vm   # Convert double-width float to unsigned integer, truncating.
    vfncvt.rtz.x.f.w  vd, vs2, vm   # Convert double-width float to signed integer, truncating.

    vfncvt.f.xu.w vd, vs2, vm       # Convert double-width unsigned integer to float.
    vfncvt.f.x.w  vd, vs2, vm       # Convert double-width signed integer to float.

    vfncvt.f.f.w vd, vs2, vm        # Convert double-width float to single-width float.
    vfncvt.rod.f.f.w vd, vs2, vm    # Convert double-width float to single-width float,
                                    #  rounding towards odd.

    A full set of floating-point narrowing conversions is not supported as single instructions.
    Conversions can be implemented in a sequence of halving steps. Results are equivalently rounded
    and the same exception flags are raised if all but the last halving step use roundtowards-odd (vfncvt.rod.f.f.w).
    Only the final step should use the desired rounding mode.


## 14. Vector Reduction Operations

### 14.1. Vector Single-Width Integer Reduction Instructions

    # Simple reductions, where [*] denotes all active elements:
    vredsum.vs  vd, vs2, vs1, vm   # vd[0] =  sum( vs1[0] , vs2[*] )
    vredmaxu.vs vd, vs2, vs1, vm   # vd[0] = maxu( vs1[0] , vs2[*] )
    vredmax.vs  vd, vs2, vs1, vm   # vd[0] =  max( vs1[0] , vs2[*] )
    vredminu.vs vd, vs2, vs1, vm   # vd[0] = minu( vs1[0] , vs2[*] )
    vredmin.vs  vd, vs2, vs1, vm   # vd[0] =  min( vs1[0] , vs2[*] )
    vredand.vs  vd, vs2, vs1, vm   # vd[0] =  and( vs1[0] , vs2[*] )
    vredor.vs   vd, vs2, vs1, vm   # vd[0] =   or( vs1[0] , vs2[*] )
    vredxor.vs  vd, vs2, vs1, vm   # vd[0] =  xor( vs1[0] , vs2[*] )

### 14.2. Vector Widening Integer Reduction Instructions

    # Unsigned sum reduction into double-width accumulator
    vwredsumu.vs vd, vs2, vs1, vm   # 2*SEW = 2*SEW + sum(zero-extend(SEW))

    # Signed sum reduction into double-width accumulator
    vwredsum.vs  vd, vs2, vs1, vm   # 2*SEW = 2*SEW + sum(sign-extend(SEW))

### 14.3. Vector Single-Width Floating-Point Reduction Instructions

    # Simple reductions.
    vfredosum.vs vd, vs2, vs1, vm # Ordered sum
    vfredusum.vs vd, vs2, vs1, vm # Unordered sum
    vfredmax.vs  vd, vs2, vs1, vm # Maximum value
    vfredmin.vs  vd, vs2, vs1, vm # Minimum value

    The vfredosum instruction must sum the floating-point values in element order,
    starting with the scalar in vs1[0]--that is, it performs the computation:
    vd[0] = `(((vs1[0] + vs2[0]) + vs2[1]) + ...) + vs2[vl-1]`

### 14.4. Vector Widening Floating-Point Reduction Instructions

    # Simple reductions.
    vfwredosum.vs vd, vs2, vs1, vm # Ordered sum
    vfwredusum.vs vd, vs2, vs1, vm # Unordered sum

## 15. Vector Mask Instructions

### 15.1. Vector Mask-Register Logical Instructions

    vmand.mm vd, vs2, vs1   # vd.mask[i] =   vs2.mask[i] &&  vs1.mask[i]
    vmnand.mm vd, vs2, vs1  # vd.mask[i] = !(vs2.mask[i] &&  vs1.mask[i])
    vmandn.mm vd, vs2, vs1  # vd.mask[i] =   vs2.mask[i] && !vs1.mask[i]
    vmxor.mm  vd, vs2, vs1  # vd.mask[i] =   vs2.mask[i] ^^  vs1.mask[i]
    vmor.mm  vd, vs2, vs1   # vd.mask[i] =   vs2.mask[i] ||  vs1.mask[i]
    vmnor.mm  vd, vs2, vs1  # vd.mask[i] = !(vs2.mask[i] ||  vs1.mask[i])
    vmorn.mm  vd, vs2, vs1  # vd.mask[i] =   vs2.mask[i] || !vs1.mask[i]
    vmxnor.mm vd, vs2, vs1  # vd.mask[i] = !(vs2.mask[i] ^^  vs1.mask[i])

    Several assembler pseudoinstructions are defined as shorthand for common uses of mask logical operations:
    vmmv.m vd, vs  => vmand.mm vd, vs, vs   # Copy mask register
    vmclr.m vd     => vmxor.mm vd, vd, vd   # Clear mask register
    vmset.m vd     => vmxnor.mm vd, vd, vd  # Set mask register
    vmnot.m vd, vs => vmnand.mm vd, vs, vs  # Invert bits

### 15.2. Vector count population in mask `vcpop.m`

    vcpop.m rd, vs2, vm

    # The operation can be performed under a mask, in which case only the masked elements are counted.
    vcpop.m rd, vs2, v0.t # x[rd] = sum_i ( vs2.mask[i] && v0.mask[i] )

### 15.3. `vfirst` find-first-set mask bit

    vfirst.m rd, vs2, vm

### 15.4. `vmsbf.m` set-before-first mask bit

    vmsbf.m vd, vs2, vm

    # Example

    7 6 5 4 3 2 1 0   Element number

    1 0 0 1 0 1 0 0   v3 contents
                      vmsbf.m v2, v3
    0 0 0 0 0 0 1 1   v2 contents

    1 0 0 1 0 1 0 1   v3 contents
                      vmsbf.m v2, v3
    0 0 0 0 0 0 0 0   v2

    0 0 0 0 0 0 0 0   v3 contents
                      vmsbf.m v2, v3
    1 1 1 1 1 1 1 1   v2

    1 1 0 0 0 0 1 1   v0 vcontents
    1 0 0 1 0 1 0 0   v3 contents
                      vmsbf.m v2, v3, v0.t
    0 1 x x x x 1 1   v2 contents

### 15.5. `vmsif.m` set-including-first mask bit

    vmsif.m vd, vs2, vm

    # Example

    7 6 5 4 3 2 1 0   Element number

    1 0 0 1 0 1 0 0   v3 contents
                      vmsif.m v2, v3
    0 0 0 0 0 1 1 1   v2 contents

    1 0 0 1 0 1 0 1   v3 contents
                      vmsif.m v2, v3
    0 0 0 0 0 0 0 1   v2

    1 1 0 0 0 0 1 1   v0 vcontents
    1 0 0 1 0 1 0 0   v3 contents
                      vmsif.m v2, v3, v0.t
    1 1 x x x x 1 1   v2 contents

### 15.6. `vmsof.m` set-only-first mask bit

    vmsof.m vd, vs2, vm

    # Example

    7 6 5 4 3 2 1 0   Element number

    1 0 0 1 0 1 0 0   v3 contents
                      vmsof.m v2, v3
    0 0 0 0 0 1 0 0   v2 contents

    1 0 0 1 0 1 0 1   v3 contents
                      vmsof.m v2, v3
    0 0 0 0 0 0 0 1   v2

    1 1 0 0 0 0 1 1   v0 vcontents
    1 1 0 1 0 1 0 0   v3 contents
                      vmsof.m v2, v3, v0.t
    0 1 x x x x 0 0   v2 contents

### 15.8. Vector Iota Instruction

    viota.m vd, vs2, vm

    # Example

    7 6 5 4 3 2 1 0   Element number

    1 0 0 1 0 0 0 1   v2 contents
                      viota.m v4, v2 # Unmasked
    2 2 2 1 1 1 1 0   v4 result

    1 1 1 0 1 0 1 1   v0 contents
    1 0 0 1 0 0 0 1   v2 contents
    2 3 4 5 6 7 8 9   v4 contents
                      viota.m v4, v2, v0.t # Masked, vtype.vma=0
    1 1 1 5 1 7 1 0   v4 results

### 15.9. Vector Element Index Instruction

    vid.v vd, vm  # Write element ID to destination.

## 16. Vector Permutation Instructions

### 16.1. Integer Scalar Move Instructions

    vmv.x.s rd, vs2  # x[rd] = vs2[0] (vs1=0)
    vmv.s.x vd, rs1  # vd[0] = x[rs1] (vs2=0)

### 16.2. Floating-Point Scalar Move Instructions

    vfmv.f.s rd, vs2  # f[rd] = vs2[0] (rs1=0)
    vfmv.s.f vd, rs1  # vd[0] = f[rs1] (vs2=0)

### 16.3. Vector Slide Instructions

#### 16.3.1. Vector Slideup Instructions

    vslideup.vx vd, vs2, rs1, vm        # vd[i+rs1] = vs2[i]
    vslideup.vi vd, vs2, uimm, vm       # vd[i+uimm] = vs2[i]

    vslideup behavior for destination elements

    OFFSET is amount to slideup, either from x register or a 5-bit immediate

                      0 <  i < max(vstart, OFFSET)  Unchanged
    max(vstart, OFFSET) <= i < vl                   vd[i] = vs2[i-OFFSET] if v0.mask[i] enabled
                     vl <= i < VLMAX                Follow tail policy

#### 16.3.2. Vector Slidedown Instructions

    vslidedown.vx vd, vs2, rs1, vm       # vd[i] = vs2[i+rs1]
    vslidedown.vi vd, vs2, uimm, vm      # vd[i] = vs2[i+uimm]

    vslidedown behavior for source elements for element i in slide
                    0 <= i+OFFSET < VLMAX   src[i] = vs2[i+OFFSET]
                VLMAX <= i+OFFSET           src[i] = 0

    vslidedown behavior for destination element i in slide
                    0 <  i < vstart         Unchanged
               vstart <= i < vl             vd[i] = src[i] if v0.mask[i] enabled
                   vl <= i < VLMAX          Follow tail policy

#### 16.3.3. Vector Slide1up

    vslide1up.vx  vd, vs2, rs1, vm        # vd[0]=x[rs1], vd[i+1] = vs2[i]

    vslide1up behavior when vl > 0

                      i < vstart  unchanged
                  0 = i = vstart  vd[i] = x[rs1] if v0.mask[i] enabled
    max(vstart, 1) <= i < vl      vd[i] = vs2[i-1] if v0.mask[i] enabled
                vl <= i < VLMAX   Follow tail policy

#### 16.3.4. Vector Floating-Point Slide1up Instruction

    vfslide1up.vf vd, vs2, rs1, vm        # vd[0]=f[rs1], vd[i+1] = vs2[i]

#### 16.3.5. Vector Slide1down Instruction

    vslide1down.vx  vd, vs2, rs1, vm      # vd[i] = vs2[i+1], vd[vl-1]=x[rs1]

    vslide1down behavior

                        i < vstart  unchanged
              vstart <= i < vl-1    vd[i] = vs2[i+1] if v0.mask[i] enabled
              vstart <= i = vl-1    vd[vl-1] = x[rs1] if v0.mask[i] enabled
                  vl <= i < VLMAX   Follow tail policy

#### 16.3.6. Vector Floating-Point Slide1down Instruction

    vfslide1down.vf vd, vs2, rs1, vm      # vd[i] = vs2[i+1], vd[vl-1]=f[rs1]

### 16.4. Vector Register Gather Instructions

    vrgather.vv vd, vs2, vs1, vm     # vd[i] = (vs1[i] >= VLMAX) ? 0 : vs2[vs1[i]];
    vrgatherei16.vv vd, vs2, vs1, vm # vd[i] = (vs1[i] >= VLMAX) ? 0 : vs2[vs1[i]];

    vrgather.vx vd, vs2, rs1, vm  # vd[i] = (x[rs1] >= VLMAX) ? 0 : vs2[x[rs1]]
    vrgather.vi vd, vs2, uimm, vm # vd[i] =  (uimm >= VLMAX)  ? 0 : vs2[uimm]

### 16.5. Vector Compress Instruction

    vcompress.vm vd, vs2, vs1  # Compress into vd elements of vs2 where vs1 is enabled

    Example use of vcompress instruction

      8 7 6 5 4 3 2 1 0   Element number

      1 1 0 1 0 0 1 0 1   v0
      8 7 6 5 4 3 2 1 0   v1
      1 2 3 4 5 6 7 8 9   v2

                              vcompress.vm v2, v1, v0
      1 2 3 4 8 7 5 2 0   v2

#### 16.5.1. Synthesizing `vdecompress`

    Desired functionality of 'vdecompress'
      7 6 5 4 3 2 1 0     # vid

            e d c b a     # packed vector of 5 elements
      1 0 0 1 1 1 0 1     # mask vector of 8 elements
      p q r s t u v w     # destination register before vdecompress

      e q r d c b v a     # result of vdecompress

    # v0 holds mask
    # v1 holds packed data
    # v11 holds input expanded vector and result
    viota.m v10, v0                 # Calc iota from mask in v0
    vrgather.vv v11, v1, v10, v0.t  # Expand into destination

    p q r s t u v w    # v11 destination register
          e d c b a    # v1 source vector
    1 0 0 1 1 1 0 1    # v0 mask vector

    4 4 4 3 2 1 1 0    # v10 result of viota.m
    e q r d c b v a    # v11 destination after vrgather using viota.m under mask

### 16.6. Whole Vector Register Move

    vmv<nr>r.v vd, vs2  # General form

    vmv1r.v v1, v2   #  Copy v1=v2
    vmv2r.v v10, v12 #  Copy v10=v12; v11=v13
    vmv4r.v v4, v8   #  Copy v4=v8; v5=v9; v6=v10; v7=v11
    vmv8r.v v0, v8   #  Copy v0=v8; v1=v9; ...;  v7=v15
