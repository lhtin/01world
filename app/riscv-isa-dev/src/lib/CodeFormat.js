const FORMAT_LIST = {
    integer: {
        ext: ['rv32_i', 'rv32_m', 'rv32_a', 'rv64_i', 'rv64_m', 'rv64_a', 'rv32_zicsr', 'rv64_zicsr', 'rv32_zifencei', 'rv64_zifencei'],
        /* I, M, Zifencei */
        'rd rs1 rs2': {
            layout: [
                { name: 'funct7', high: 31, low: 25 },
                { name: 'rs2', high: 24, low: 20, },
                { name: 'rs1', high: 19, low: 15, },
                { name: 'funct3', high: 14, low: 12, },
                { name: 'rd', high: 11, low: 7, },
                { name: 'opcode', high: 6, low: 0 }
            ],
            asm: '{insn_name} {rd}, {rs1}, {rs2}'
        },
        'rd rs1 imm12': {
            layout: [
                { name: 'imm[11:0]', high: 31, low: 20 },
                { name: 'rs1', high: 19, low: 15, },
                { name: 'funct3', high: 14, low: 12, },
                { name: 'rd', high: 11, low: 7, },
                { name: 'opcode', high: 6, low: 0 }
            ],
            asm: '{insn_name} {rd}, {rs1}, {imm}'
        },
        'imm12hi rs1 rs2 imm12lo': {
            layout: [
                { name: 'imm[11:5]', high: 31, low: 25 },
                { name: 'rs2', high: 24, low: 20, },
                { name: 'rs1', high: 19, low: 15, },
                { name: 'funct3', high: 14, low: 12, },
                { name: 'imm[4:0]', high: 11, low: 7, },
                { name: 'opcode', high: 6, low: 0 }
            ],
            asm: '{insn_name} {rs2}, {imm}({rs1})'
        },
        'bimm12hi rs1 rs2 bimm12lo': {
            layout: [
                { name: "imm[12|10:5]", high: 31, low: 25 },
                { name: 'rs2', high: 24, low: 20, },
                { name: 'rs1', high: 19, low: 15, },
                { name: 'funct3', high: 14, low: 12, },
                { name: 'imm[4:1|11]', high: 11, low: 7, },
                { name: 'opcode', high: 6, low: 0 }
            ],
            asm: '{insn_name} {rs1}, {rs2}, {imm}'
        },
        'rd imm20': {
            layout: [
                { name: "imm[31:12]", high: 31, low: 12, },
                { name: 'rd', high: 11, low: 7, },
                { name: 'opcode', high: 6, low: 0 }
            ],
            asm: '{insn_name} {rd}, {imm}'
        },
        'rd jimm20': {
            layout: [
                { name: "imm[20|10:1|11|19:12]", high: 31, low: 12, },
                { name: 'rd', high: 11, low: 7, },
                { name: 'opcode', high: 6, low: 0 }
            ],
            asm: '{insn_name} {rd}, {imm}'
        },
        /* A */
        'rd rs1 aq rl': {
            layout: [
                { name: 'funct5', high: 31, low: 27 },
                { name: 'aq', high: 26, low: 26},
                { name: 'rl', high: 25, low: 25},
                { name: 'rs2', high: 24, low: 20, },
                { name: 'rs1', high: 19, low: 15, },
                { name: 'funct3', high: 14, low: 12, },
                { name: 'rd', high: 11, low: 7, },
                { name: 'opcode', high: 6, low: 0 }
            ],
            asm: '{insn_name}{_aqrl_} {rd}, ({rs1})'
        },
        'rd rs1 rs2 aq rl': {
            layout: [
                { name: 'funct5', high: 31, low: 27 },
                { name: 'aq', high: 26, low: 26},
                { name: 'rl', high: 25, low: 25},
                { name: 'rs2', high: 24, low: 20, },
                { name: 'rs1', high: 19, low: 15, },
                { name: 'funct3', high: 14, low: 12, },
                { name: 'rd', high: 11, low: 7, },
                { name: 'opcode', high: 6, low: 0 }
            ],
            asm: '{insn_name}{_aqrl_} {rd}, {rs1}, ({rs2})',
        },
        /* Zicsr */
        'rd rs1 csr': {
            layout: [
                { name: 'csr', high: 31, low: 20 },
                { name: 'rs1', high: 19, low: 15, },
                { name: 'funct3', high: 14, low: 12, },
                { name: 'rd', high: 11, low: 7, },
                { name: 'opcode', high: 6, low: 0 }
            ],
            asm: '{insn_name} {rd}, {rs1}',
        },
        'rd csr zimm': {
            layout: [
                { name: 'csr', high: 31, low: 20 },
                { name: 'uimm[4:0]', high: 19, low: 15, },
                { name: 'funct3', high: 14, low: 12, },
                { name: 'rd', high: 11, low: 7, },
                { name: 'opcode', high: 6, low: 0 }
            ],
            asm: '{insn_name} {rd}, {uimm}',
        }
    },
    float: {
        /* F, D, Q, Zfh */
        ext: ['rv32_f', 'rv32_d', 'rv32_q', 'rv64_f', 'rv64_d', 'rv64_q'],
        'rd rs1 imm12': {
            layout: [
                { name: 'imm[11:0]', high: 31, low: 20 },
                { name: 'rs1', high: 19, low: 15, },
                { name: 'width', high: 14, low: 12, },
                { name: 'rd', high: 11, low: 7, },
                { name: 'opcode', high: 6, low: 0 }
            ],
            asm: '{insn_name} {rd}, {imm}({rs1})'
        },
        'imm12hi rs1 rs2 imm12lo': {
            layout: [
                { name: 'imm[11:5]', high: 31, low: 25 },
                { name: 'rs2', high: 24, low: 20, },
                { name: 'rs1', high: 19, low: 15, },
                { name: 'width', high: 14, low: 12, },
                { name: 'imm[4:0]', high: 11, low: 7, },
                { name: 'opcode', high: 6, low: 0 }
            ],
            asm: '{insn_name} {rs2}, {imm}({rs1})'
        },
        'rd rs1 rs2 rm': {
            layout: [
                { name: 'funct5', high: 31, low: 27 },
                { name: 'fmt', high: 26, low: 25 },
                { name: 'rs2', high: 24, low: 20, },
                { name: 'rs1', high: 19, low: 15, },
                { name: 'rm', high: 14, low: 12, },
                { name: 'rd', high: 11, low: 7, },
                { name: 'opcode', high: 6, low: 0 }
            ],
            asm: '{insn_name} {rd}, {rs1}, {rs2}, {rm}'
        },
        'rd rs1 rm': {
            layout: [
                { name: 'funct5', high: 31, low: 27 },
                { name: 'fmt', high: 26, low: 25 },
                { name: 'rs2', high: 24, low: 20 },
                { name: 'rs1', high: 19, low: 15, },
                { name: 'rm', high: 14, low: 12 },
                { name: 'rd', high: 11, low: 7, },
                { name: 'opcode', high: 6, low: 0 }
            ],
            asm: '{insn_name} {rd}, {rs1}, {rm}'
        },
        'rd rs1 rs2': {
            layout: [
                { name: 'funct5', high: 31, low: 27 },
                { name: 'fmt', high: 26, low: 25 },
                { name: 'rs2', high: 24, low: 20, },
                { name: 'rs1', high: 19, low: 15, },
                { name: 'rm', high: 14, low: 12},
                { name: 'rd', high: 11, low: 7, },
                { name: 'opcode', high: 6, low: 0 }
            ],
            asm: '{insn_name} {rd}, {rs1}, {rs2}'
        },
        'rd rs1 rs2 rs3 rm': {
            layout: [
                { name: "rs3", high: 31, low: 27 },
                { name: 'fmt', high: 26, low: 25 },
                { name: 'rs2', high: 24, low: 20 },
                { name: 'rs1', high: 19, low: 15 },
                { name: 'rm', high: 14, low: 12 },
                { name: 'rd', high: 11, low: 7 },
                { name: 'opcode', high: 6, low: 0 }
            ],
            asm: '{insn_name} {rd}, {rs1}, {rs2}, {rs3}, {rm}'
        },
        'rd rs1': {
            layout: [
                { name: 'funct5', high: 31, low: 27 },
                { name: 'fmt', high: 26, low: 25 },
                { name: 'rs2', high: 24, low: 20 },
                { name: 'rs1', high: 19, low: 15, },
                { name: 'rm', high: 14, low: 12 },
                { name: 'rd', high: 11, low: 7, },
                { name: 'opcode', high: 6, low: 0 }
            ],
            asm: '{insn_name} {rd}, {rs1}'
        },
    },
    compressed: {
        ext: ['rv32_c', 'rv64_c'],
        /* C */
        'rd_n0 c_uimm8sphi c_uimm8splo': {
            layout: [
                { name: 'funct3', high: 15, low: 13 },
                { name: 'uimm[5]', high: 12, low: 12 },
                { name: 'rd', high: 11, low: 7 },
                { name: 'uimm[4:2|7:6]', high: 6, low: 2 },
                { name: 'op', high: 1, low: 0 }
            ],
            asm: '{insn_name} {rd}, {uimm}'
        },
        'rd_n0 c_uimm9sphi c_uimm9splo': {
            layout: [
                { name: 'funct3', high: 15, low: 13 },
                { name: 'uimm[5]', high: 12, low: 12 },
                { name: 'rd', high: 11, low: 7 },
                { name: 'uimm[4:3|8:6]', high: 6, low: 2 },
                { name: 'op', high: 1, low: 0 }
            ],
            asm: '{insn_name} {rd}, {uimm}'
        },
        'rd c_uimm8sphi c_uimm8splo': {
            layout: [
                { name: 'funct3', high: 15, low: 13 },
                { name: 'uimm[5]', high: 12, low: 12 },
                { name: 'rd', high: 11, low: 7 },
                { name: 'uimm[4:2|7:6]', high: 6, low: 2 },
                { name: 'op', high: 1, low: 0 }
            ],
            asm: '{insn_name} {rd}, {uimm}'
        },
        'rd c_uimm9sphi c_uimm9splo': {
            layout: [
                { name: 'funct3', high: 15, low: 13 },
                { name: 'uimm[5]', high: 12, low: 12 },
                { name: 'rd', high: 11, low: 7 },
                { name: 'uimm[4:3|8:6]', high: 6, low: 2 },
                { name: 'op', high: 1, low: 0 }
            ],
            asm: '{insn_name} {rd}, {uimm}'
        },
        'c_rs2 c_uimm8sp_s': {
            layout: [
                { name: 'funct3', high: 15, low: 13 },
                { name: 'uimm[5:2|7:6]', high: 12, low: 7 },
                { name: 'r2', high: 6, low: 2 },
                { name: 'op', high: 1, low: 0 }
            ],
            asm: '{insn_name} {rs2}, {uimm}'
        },
        'c_rs2 c_uimm9sp_s': {
            layout: [
                { name: 'funct3', high: 15, low: 13 },
                { name: 'uimm[5:3|8:6]', high: 12, low: 7 },
                { name: 'r2', high: 6, low: 2 },
                { name: 'op', high: 1, low: 0 }
            ],
            asm: '{insn_name} {rs2}, {uimm}'
        },
        'rd_p rs1_p c_uimm7lo c_uimm7hi': {
            layout: [
                { name: 'funct3', high: 15, low: 13 },
                { name: 'uimm[5:3]', high: 12, low: 10 },
                { name: 'rs1_p', high: 9, low: 7 },
                { name: 'uimm[2|6]', high: 6, low: 5 },
                { name: 'rd_p', high: 4, low: 2 },
                { name: 'op', high: 1, low: 0 }
            ],
            asm: '{insn_name} {rd_p}, {uimm}({rs1_p})'
        },
        'rd_p rs1_p c_uimm8lo c_uimm8hi': {
            layout: [
                { name: 'funct3', high: 15, low: 13 },
                { name: 'uimm[5:3]', high: 12, low: 10 },
                { name: 'rs1_p', high: 9, low: 7 },
                { name: 'uimm[7:6]', high: 6, low: 5 },
                { name: 'rd_p', high: 4, low: 2 },
                { name: 'op', high: 1, low: 0 }
            ],
            asm: '{insn_name} {rd_p}, {uimm}({rs1_p})'
        },
        'rs1_p rs2_p c_uimm7lo c_uimm7hi': {
            layout: [
                { name: 'funct3', high: 15, low: 13 },
                { name: 'uimm[5:3]', high: 12, low: 10 },
                { name: 'rs1_p', high: 9, low: 7 },
                { name: 'uimm[2|6]', high: 6, low: 5 },
                { name: 'rs2_p', high: 4, low: 2 },
                { name: 'op', high: 1, low: 0 }
            ],
            asm: '{insn_name} {rs2_p}, {uimm}({rs1_p})'
        },
        'rs1_p rs2_p c_uimm8hi c_uimm8lo': {
            layout: [
                { name: 'funct3', high: 15, low: 13 },
                { name: 'uimm[5:3]', high: 12, low: 10 },
                { name: 'rs1_p', high: 9, low: 7 },
                { name: 'uimm[7:6]', high: 6, low: 5 },
                { name: 'rs2_p', high: 4, low: 2 },
                { name: 'op', high: 1, low: 0 }
            ],
            asm: '{insn_name} {rs2_p}, {uimm}({rs1_p})'
        },
        'c_imm12': {
            layout: [
                { name: 'funct3', high: 15, low: 13 },
                { name: 'imm[11|4|9:8|10|6|7|3:1|5]', high: 12, low: 2 },
                { name: 'op', high: 1, low: 0 }
            ],
            asm: '{insn_name} {imm}'
        },
        'rs1_n0': {
            layout: [
                { name: 'funct4', high: 15, low: 12 },
                { name: 'rs1', high: 11, low: 7 },
                { name: 'rs2', high: 6, low: 2 },
                { name: 'op', high: 1, low: 0 }
            ],
            asm: '{insn_name} {rs1}'
        },
        'rs1_p c_bimm9lo c_bimm9hi': {
            layout: [
                { name: 'funct3', high: 15, low: 13 },
                { name: 'imm[8|4:3]', high: 12, low: 10 },
                { name: 'rs1_p', high: 9, low: 7 },
                { name: 'imm[7:6|2:1|5]', high: 6, low: 2 },
                { name: 'op', high: 1, low: 0 }
            ],
            asm: '{insn_name} {rs1_p}, {imm}'
        },
        'rd c_imm6lo c_imm6hi': {
            layout: [
                { name: 'funct3', high: 15, low: 13 },
                { name: 'imm[5]', high: 12, low: 12 },
                { name: 'rd', high: 11, low: 7 },
                { name: 'imm[4:0]', high: 6, low: 2 },
                { name: 'op', high: 1, low: 0 }
            ],
            asm: '{insn_name} {rd}, {imm}'
        },
        'rd_n2 c_nzimm18hi c_nzimm18lo': {
            layout: [
                { name: 'funct3', high: 15, low: 13 },
                { name: 'imm[17]', high: 12, low: 12 },
                { name: 'rd', high: 11, low: 7 },
                { name: 'imm[16:12]', high: 6, low: 2 },
                { name: 'op', high: 1, low: 0 }
            ],
            asm: '{insn_name} {rd}, {imm}'
        },
        'rd_rs1_n0 c_nzimm6lo c_nzimm6hi': {
            layout: [
                { name: 'funct3', high: 15, low: 13 },
                { name: 'imm[5]', high: 12, low: 12 },
                { name: 'rd', high: 11, low: 7 },
                { name: 'imm[4:0]', high: 6, low: 2 },
                { name: 'op', high: 1, low: 0 }
            ],
            asm: '{insn_name} {rd}, {imm}'
        },
        'rd_rs1 c_imm6lo c_imm6hi': {
            layout: [
                { name: 'funct3', high: 15, low: 13 },
                { name: 'imm[5]', high: 12, low: 12 },
                { name: 'rd', high: 11, low: 7 },
                { name: 'imm[4:0]', high: 6, low: 2 },
                { name: 'op', high: 1, low: 0 }
            ],
            asm: '{insn_name} {rd}, {imm}'
        },
        'c_nzimm10hi c_nzimm10lo': {
            layout: [
                { name: 'funct3', high: 15, low: 13 },
                { name: 'imm[9]', high: 12, low: 12 },
                { name: 'rd', high: 11, low: 7, vlaue: 2 },
                { name: 'imm[4|6|8:7|5]', high: 6, low: 2 },
                { name: 'op', high: 1, low: 0 }
            ],
            asm: '{insn_name} {rd}, {imm}'
        },
        'rd_p c_nzuimm10': {
            layout: [
                { name: 'funct3', high: 15, low: 13 },
                { name: 'uimm[5:4|9:6|2|3]', high: 12, low: 5 },
                { name: 'rd_p', high: 4, low: 2 },
                { name: 'op', high: 1, low: 0 }
            ],
            asm: '{insn_name} {rd_p}, {uimm}'
        },
        'rd_rs1_n0 c_nzuimm6hi c_nzuimm6lo': {
            layout: [
                { name: 'funct3', high: 15, low: 13 },
                { name: 'uimm[5]', high: 12, low: 12 },
                { name: 'rd', high: 11, low: 7, not_value: [0] },
                { name: 'uimm[4:0]', high: 6, low: 2 },
                { name: 'op', high: 1, low: 0 }
            ],
            asm: '{insn_name} {rd}, {uimm}'
        },
        'rd_rs1_p c_nzuimm6lo c_nzuimm6hi': {
            layout: [
                { name: 'funct3', high: 15, low: 13 },
                { name: 'uimm[5]', high: 12, low: 12 },
                { name: 'funct2', high: 11, low: 10 },
                { name: 'rd_p', high: 9, low: 7 },
                { name: 'uimm[4:0]', high: 6, low: 2 },
                { name: 'op', high: 1, low: 0 }
            ],
            asm: '{insn_name} {rd_p}, {uimm}'
        },
        'rd_rs1_p c_imm6hi c_imm6lo': {
            layout: [
                { name: 'funct3', high: 15, low: 13 },
                { name: 'imm[5]', high: 12, low: 12 },
                { name: 'funct2', high: 11, low: 10 },
                { name: 'rd_p', high: 9, low: 7 },
                { name: 'imm[4:0]', high: 6, low: 2 },
                { name: 'op', high: 1, low: 0 }
            ],
            asm: '{insn_name} {rd_p}, {imm}'
        },
        'rd c_rs2_n0': {
            layout: [
                { name: 'funct4', high: 15, low: 12 },
                { name: 'rd', high: 11, low: 7 },
                { name: 'rs2', high: 6, low: 2, not_value: [0] },
                { name: 'op', high: 1, low: 0 }
            ],
            asm: '{insn_name} {rd}, {rs2}'
        },
        'rd_rs1_p rs2_p': {
            layout: [
                { name: 'funct6', high: 15, low: 10 },
                { name: 'rd_p', high: 9, low: 7 },
                { name: 'funct2', hight: 6, low: 5 },
                { name: 'rs2_p', high: 4, low: 2 },
                { name: 'op', high: 1, low: 0 }
            ],
            asm: '{insn_name} {rd_p}, {rs2_p}'
        }
    }
}

export {
    FORMAT_LIST
}