# Intrinsic Pattern

The intrinsics which do not specify the mask or tail policy can be decided by the compiler.

Some difference is because the backward compatibility intrinsic is different.

- mask policy and tail policy
  - 7\. Vector load
    - except mask load（vlm）
  - 11.1. Vector Single-Width Integer Add and Subtract
  - 11.2. Vector Widening Integer Add/Subtract
  - 11.3. Vector Integer Extension
  - 11.5. Vector Bitwise Logical Instructions
  - 11.6. Vector Single-Width Shift Instructions
  - 11.7. Vector Narrowing Integer Right Shift Instructions
  - 11.9. Vector Integer Min/Max Instructions
  - 11.10. Vector Single-Width Integer Multiply Instructions
  - 11.11. Vector Integer Divide Instructions
  - 11.12. Vector Widening Integer Multiply Instructions
  - 12.1. Vector Single-Width Saturating Add and Subtract
  - 12.2. Vector Single-Width Averaging Add and Subtract
  - 12.3. Vector Single-Width Fractional Multiply with Rounding and Saturation
  - 12.4. Vector Single-Width Scaling Shift Instructions
  - 12\. Vector Fixed-Point Arithmetic Instructions
  - 13\. Vector Floating-Point Instructions
    - 13.14. Vector Floating-Point Classify Instruction (当前的intrinsic文档，vfclass没有提供_tu的版本，但是根据ISA规范，应该要提供，需要再确认下）
    - except 13.6, 13.7, 13.13, 13.15, 13.16
  - 14\. Vector Reduction Operations
  - 15.8. Vector Iota Instruction
  - 15.9. Vector Element Index Instruction
  - 16.3. Vector Slide Instructions (当前的intrinsic文档，vfclass没有提供_tu的版本，但是根据ISA规范，应该要提供，需要再确认下）
  - 16.4. Vector Register Gather Instructions

  | Masked? | TU? | MU? | Intrinsic |
  | ------- | --- | --- | --------- |
  | No      | No  | N/A | `vadd_vv_i8m1_ta(vs2, vs1, vl)`<br>`vadd_vv_i8m1(vs2, vs1, vl)` |
  | No      | Yes | N/A | `vadd_vv_i8m1_tu(vd, vs2, vs1, vl)` |
  | Yes     | No  | No  | `vadd_vv_i8m1_tama(mask, vs2, vs1, vl)` |
  | Yes     | No  | Yes | `vadd_vv_i8m1_tamu(mask, vd, vs2, vs1, vl)`<br>`vadd_vv_i8m1_m(mask, vd, vs2, vs1, vl)` |
  | Yes     | Yes | No  | `vadd_vv_i8m1_tuma(mask, vd, vs2, vs1, vl)` |
  | Yes     | Yes | Yes | `vadd_vv_i8m1_tumu(mask, vd, vs2, vs1, vl)` |

- mask policy and tail policy and vd get involved
  - 11.13. Vector Single-Width Integer Multiply-Add Instructions
  - 11.14. Vector Widening Integer Multiply-Add Instructions
  - 13.6. Vector Single-Width Floating-Point Fused Multiply-Add Instructions
  - 13.7. Vector Widening Floating-Point Fused Multiply-Add Instructions

  | Masked? | TU? | MU? | Intrinsic |
  | ------- | --- | --- | --------- |
  | No      | No  | N/A | `vmacc_vv_i8m1_ta(vd, vs1, vs2, vl)`<br>`vmacc_vv_i8m1(vd, vs1, vs2, vl)` |
  | No      | Yes | N/A | `vmacc_vv_i8m1_tu(vd, vs1, vs2, vl)` |
  | Yes     | No  | No  | `vmacc_vv_i8m1_tama(mask, vd, vs1, vs2, vl)` |
  | Yes     | No  | Yes | `vmacc_vv_i8m1_tamu(mask, vd, vs1, vs2, vl)`<br>`vmacc_vv_i8m1_m(mask, vd, vs1, vs2, vl)` |
  | Yes     | Yes | No  | `vmacc_vv_i8m1_tuma(mask, vd, vs1, vs2, vl)` |
  | Yes     | Yes | Yes | `vmacc_vv_i8m1_tumu(mask, vd, vs1, vs2, vl)` |

- only mask policy
  - 7\. Vector Store
    - except mask store(vsm)
  - 11.8. Vector Integer Compare Instructions
  - 13.13. Vector Floating-Point Compare Instructions
  - 15.2. Vector count population in mask vcpop.m
  - 15.3. vfirst find-first-set mask bit
  - 15.4. vmsbf.m set-before-first mask bit
  - 15.5. vmsif.m set-including-first mask bit
  - 15.6. vmsof.m set-only-first mask bit

  | Masked? | TU? | MU?  | Intrinsic |
  | ------- | --- | ---- | --------- |
  | No      | N/A  | N/A | `vmseq_vv_i8m1_b8(vs1, vs2, vl)` |
  | Yes     | N/A  | No  | `vmseq_vv_i8m1_b8_ma(mask, vs1, vs2, vl)` |
  | Yes     | N/A  | Yes | `vmseq_vv_i8m1_b8_mu(mask, vd, vs1, vs2, vl)`<br>`vmseq_vv_i8m1_b8_m(mask, vd, vs1, vs2, vl)` |

- only tail policy
  
  Some intrinsics are considered non-mask operations even though have mask parameters. Because the mask parameter in there doesn't control the active or inactive status of vd's elements. like `vmerge.vvm`, `vcompress.vm`.
  - 11.4. Vector Integer Add-with-Carry / Subtract-with-Borrow Instructions
    - vadc.vvm, vadc.vxm, vadc.vim
    - vsbc.vvm, vsbc.vxm
  - 11.15. Vector Integer Merge Instructions
  - 11.16. Vector Integer Move Instructions
  - 13.15. Vector Floating-Point Merge Instruction
  - 13.16. Vector Floating-Point Move Instruction
  - 16.1. Integer Scalar Move Instructions
    - vmv.s.x
  - 16.2. Floating-Point Scalar Move Instructions
    - vfmv.s.f
  - 16.5. Vector Compress Instruction (当前intrinsic文档没有提供_tu版本，但是根据ISA应该提供)

  | Masked? | TU? | MU? | Intrinsic |
  | ------- | --- | --- | --------- |
  | No      | No  | N/A | `vmv_s_x_i8m1_ta(src, vl)`<br>`vmv_s_x_i8m1(src, vl)` |
  | No      | Yes | N/A | `vmv_s_x_i8m1_tu(dest, src, vl)` |

- ignore mask policy and ignore tail policy
  - 7\. Mask load and streo(vlm, vsm)
  - 11.4. Vector Integer Add-with-Carry / Subtract-with-Borrow Instructions
    - vmadc.vvm, vmadc.vxm, vmadc.vim, vmadc.vv vmadc.vx, vmadc.vi
    - vmsbc.vvm, vmsbc.vxm, vmsbc.vv, vmsbc.vx
  - 15.1. Vector Mask-Register Logical Instructions
  - 16.1. Integer Scalar Move Instructions
    - vmv.x.s
  - 16.2. Floating-Point Scalar Move Instructions
    - vfmv.f.s

  | Masked? | TU? | MU?  | Intrinsic |
  | ------- | --- | ---- | --------- |
  | No      | N/A  | N/A | `vmadc_vvm_i8m1_b8(vs1, vs2, carryin, vl)` |
