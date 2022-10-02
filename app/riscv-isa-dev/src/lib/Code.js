const getABIReg = (insn_name, r) => {
    if (insn_name.startsWith('f') || insn_name.startsWith('c.f')) {
        return [
            "ft0", "ft1", "ft2", "ft3", "ft4", "ft5", "ft6", "ft7",
            "fs0", "fs1", "fa0", "fa1", "fa2", "fa3", "fa4", "fa5",
            "fa6", "fa7", "fs2", "fs3", "fs4", "fs5", "fs6", "fs7",
            "fs8", "fs9", "fs10", "fs11", "ft8", "ft9", "ft10", "ft11"
        ][r]
    }
    return [
        "zero", "ra", "sp", "gp", "tp", "t0", "t1", "t2",
        "s0", "s1", "a0", "a1", "a2", "a3", "a4", "a5",
        "a6", "a7", "s2", "s3", "s4", "s5", "s6", "s7",
        "s8", "s9", "s10", "s11", "t3", "t4", "t5", "t6"][r]
}

const format_code = (code) => {
    let bin = code.toString(2)
    if ((code & 0b11) !== 0b11) {
        bin = bin.padStart(16, '0')
    } else if ((code & 0b11100) !== 0b11100) {
        bin = bin.padStart(32, '0')
    }
    return bin
}

const FORMAT_LIST = {
    /* I, M, A, F, D, Q, Zfh */
    'rd rs1 rs2': {
        type: 'R-type',
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
        type: 'I-type',
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
        type: 'S-type',
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
        type: 'B-type',
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
        type: 'U-type',
        layout: [
            { name: "imm[31:12]", high: 31, low: 12, },
            { name: 'rd', high: 11, low: 7, },
            { name: 'opcode', high: 6, low: 0 }
        ],
        asm: '{insn_name} {rd}, {imm}'
    },
    'rd jimm20': {
        type: 'J-type',
        layout: [
            { name: "imm[20|10:1|11|19:12]", high: 31, low: 12, },
            { name: 'rd', high: 11, low: 7, },
            { name: 'opcode', high: 6, low: 0 }
        ],
        asm: '{insn_name} {rd}, {imm}'
    },
    'rd rs1 rs2 rs3 rm': {
        type: 'R4-type',
        layout: [
            { name: "rs3", high: 31, low: 27 },
            { name: 'funct2', high: 26, low: 25 },
            { name: 'rs2', high: 24, low: 20 },
            { name: 'rs1', high: 19, low: 15 },
            { name: 'rm', high: 14, low: 12 },
            { name: 'rd', high: 11, low: 7 },
            { name: 'opcode', high: 6, low: 0 }
        ],
        asm: '{insn_name} {rd}, {rs1}, {rs2}, {rs3}'
    },
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
            {name: 'funct3', high: 15, low: 13},
            {name: 'uimm[5:2|7:6]', high: 12, low: 7},
            {name: 'r2', high: 6, low: 2},
            {name: 'op', high: 1, low: 0}
        ],
        asm: '{insn_name} {rs2}, {uimm}'
    },
    'c_rs2 c_uimm9sp_s': {
        layout: [
            {name: 'funct3', high: 15, low: 13},
            {name: 'uimm[5:3|8:6]', high: 12, low: 7},
            {name: 'r2', high: 6, low: 2},
            {name: 'op', high: 1, low: 0}
        ],
        asm: '{insn_name} {rs2}, {uimm}'
    },
    'rd_p rs1_p c_uimm7lo c_uimm7hi': {
        layout: [
            {name: 'funct3', high: 15, low: 13},
            {name: 'uimm[5:3]', high: 12, low: 10},
            {name: 'rs1_p', high: 9, low: 7},
            {name: 'uimm[2|6]', high: 6, low: 5},
            {name: 'rd_p', high: 4, low: 2},
            {name: 'op', high: 1, low: 0}
        ],
        asm: '{insn_name} {rd_p}, {uimm}({rs1_p})'
    },
    'rd_p rs1_p c_uimm8lo c_uimm8hi': {
        layout: [
            {name: 'funct3', high: 15, low: 13},
            {name: 'uimm[5:3]', high: 12, low: 10},
            {name: 'rs1_p', high: 9, low: 7},
            {name: 'uimm[7:6]', high: 6, low: 5},
            {name: 'rd_p', high: 4, low: 2},
            {name: 'op', high: 1, low: 0}
        ],
        asm: '{insn_name} {rd_p}, {uimm}({rs1_p})'
    },
    'rs1_p rs2_p c_uimm7lo c_uimm7hi': {
        layout: [
            {name: 'funct3', high: 15, low: 13},
            {name: 'uimm[5:3]', high: 12, low: 10},
            {name: 'rs1_p', high: 9, low: 7},
            {name: 'uimm[2|6]', high: 6, low: 5},
            {name: 'rs2_p', high: 4, low: 2},
            {name: 'op', high: 1, low: 0}
        ],
        asm: '{insn_name} {rs2_p}, {uimm}({rs1_p})'
    },
    'rs1_p rs2_p c_uimm8hi c_uimm8lo': {
        layout: [
            {name: 'funct3', high: 15, low: 13},
            {name: 'uimm[5:3]', high: 12, low: 10},
            {name: 'rs1_p', high: 9, low: 7},
            {name: 'uimm[7:6]', high: 6, low: 5},
            {name: 'rs2_p', high: 4, low: 2},
            {name: 'op', high: 1, low: 0}
        ],
        asm: '{insn_name} {rs2_p}, {uimm}({rs1_p})'
    },
    'c_imm12': {
        layout: [
            {name: 'funct3', high: 15, low: 13},
            {name: 'imm[11|4|9:8|10|6|7|3:1|5]', high: 12, low: 2},
            {name: 'op', high: 1, low: 0}
        ],
        asm: '{insn_name} {imm}'
    },
    'rs1_n0': {
        layout: [
            {name: 'funct4', high: 15, low: 12},
            {name: 'rs1', high: 11, low: 7},
            {name: 'rs2', high: 6, low: 2},
            {name: 'op', high: 1, low: 0}
        ],
        asm: '{insn_name} {rs1}'
    },
    'rs1_p c_bimm9lo c_bimm9hi': {
        layout: [
            {name: 'funct3', high: 15, low: 13},
            {name: 'imm[8|4:3]', high: 12, low: 10},
            {name: 'rs1_p', high: 9, low: 7},
            {name: 'imm[7:6|2:1|5]', high: 6, low: 2},
            {name: 'op', high: 1, low: 0}
        ],
        asm: '{insn_name} {rs1_p}, {imm}'
    },
    'rd c_imm6lo c_imm6hi': {
        layout: [
            {name: 'funct3', high: 15, low: 13},
            {name: 'imm[5]', high: 12, low: 12},
            {name: 'rd', high: 11, low: 7},
            {name: 'imm[4:0]', high: 6, low: 2},
            {name: 'op', high: 1, low: 0}
        ],
        asm: '{insn_name} {rd}, {imm}'
    },
    'rd_n2 c_nzimm18hi c_nzimm18lo': {
        layout: [
            {name: 'funct3', high: 15, low: 13},
            {name: 'imm[17]', high: 12, low: 12},
            {name: 'rd', high: 11, low: 7},
            {name: 'imm[16:12]', high: 6, low: 2},
            {name: 'op', high: 1, low: 0}
        ],
        asm: '{insn_name} {rd}, {imm}'
    },
    'rd_rs1_n0 c_nzimm6lo c_nzimm6hi': {
        layout: [
            {name: 'funct3', high: 15, low: 13},
            {name: 'imm[5]', high: 12, low: 12},
            {name: 'rd', high: 11, low: 7},
            {name: 'imm[4:0]', high: 6, low: 2},
            {name: 'op', high: 1, low: 0}
        ],
        asm: '{insn_name} {rd}, {imm}'
    },
    'rd_rs1 c_imm6lo c_imm6hi': {
        layout: [
            {name: 'funct3', high: 15, low: 13},
            {name: 'imm[5]', high: 12, low: 12},
            {name: 'rd', high: 11, low: 7},
            {name: 'imm[4:0]', high: 6, low: 2},
            {name: 'op', high: 1, low: 0}
        ],
        asm: '{insn_name} {rd}, {imm}'
    },
    'c_nzimm10hi c_nzimm10lo': {
        layout: [
            {name: 'funct3', high: 15, low: 13},
            {name: 'imm[9]', high: 12, low: 12},
            {name: 'rd', high: 11, low: 7, vlaue: 2},
            {name: 'imm[4|6|8:7|5]', high: 6, low: 2},
            {name: 'op', high: 1, low: 0}
        ],
        asm: '{insn_name} {rd}, {imm}' 
    },
    'rd_p c_nzuimm10': {
        layout: [
            {name: 'funct3', high: 15, low: 13},
            {name: 'uimm[5:4|9:6|2|3]', high: 12, low: 5},
            {name: 'rd_p', high: 4, low: 2},
            {name: 'op', high: 1, low: 0}
        ],
        asm: '{insn_name} {rd_p}, {uimm}'
    },
    'rd_rs1_n0 c_nzuimm6hi c_nzuimm6lo': {
        layout: [
            {name: 'funct3', high: 15, low: 13},
            {name: 'uimm[5]', high: 12, low: 12},
            {name: 'rd', high: 11, low: 7, not_value: 0},
            {name: 'uimm[4:0]', high: 6, low: 2},
            {name: 'op', high: 1, low: 0}
        ],
        asm: '{insn_name} {rd}, {uimm}'
    },
    'rd_rs1_p c_nzuimm6lo c_nzuimm6hi': {
        layout: [
            {name: 'funct3', high: 15, low: 13},
            {name: 'uimm[5]', high: 12, low: 12},
            {name: 'funct2', high: 11, low: 10},
            {name: 'rd_p', high: 9, low: 7},
            {name: 'uimm[4:0]', high: 6, low: 2},
            {name: 'op', high: 1, low: 0}
        ],
        asm: '{insn_name} {rd_p}, {uimm}'
    },
    'rd_rs1_p c_imm6hi c_imm6lo': {
        layout: [
            {name: 'funct3', high: 15, low: 13},
            {name: 'imm[5]', high: 12, low: 12},
            {name: 'funct2', high: 11, low: 10},
            {name: 'rd_p', high: 9, low: 7},
            {name: 'imm[4:0]', high: 6, low: 2},
            {name: 'op', high: 1, low: 0}
        ],
        asm: '{insn_name} {rd_p}, {imm}'
    },
    'rd c_rs2_n0': {
        layout: [
            {name: 'funct4', high: 15, low: 12},
            {name: 'rd', high: 11, low: 7},
            {name: 'rs2', high: 6, low: 2, not_value: 0},
            {name: 'op', high: 1, low: 0}
        ],
        asm: '{insn_name} {rd}, {rs2}'
    },
    'rd_rs1_p rs2_p': {
        layout: [
            {name: 'funct6', high: 15, low: 10},
            {name: 'rd_p', high: 9, low: 7},
            {name: 'funct2', hight: 6, low: 5},
            {name: 'rs2_p', high: 4, low: 2},
            {name: 'op', high: 1, low: 0}
        ],
        asm: '{insn_name} {rd_p}, {rs2_p}'
    }
}

const parseFields = (layout, code, xlen) => {
    let fieldCodeMap = {}
    for (let field of layout) {
        let result = /^([^[\]]+)(?:\[([0-9:|]+)\])?$/.exec(field.name)
        let field_name = result[1]
        let range = result[2]
        let ranges = []
        if (range === undefined) {
            ranges.push([field.high - field.low, 0])
        } else {
            let temp1 = range.split(/\|/)
            for (let item of temp1) {
                let temp2 = item.split(/:/).map((s) => Number(s))
                console.assert(temp2.length === 1 || temp2.length === 2)
                if (temp2.length === 1) {
                    ranges.push([temp2[0], temp2[0]])
                } else {
                    ranges.push([temp2[0], temp2[1]])
                }
            }
        }
        let map = fieldCodeMap[field_name] ?? []
        let field_at = field.high
        for (let i = 0; i < ranges.length; i += 1) {
            let high = ranges[i][0]
            let low = ranges[i][1]
            for (let j = high; j >= low; j -= 1) {
                map[j] = field_at
                field_at -= 1
            }
        }
        fieldCodeMap[field_name] = map
    }
    let fieldMap = {}
    for (let field_name of Object.keys(fieldCodeMap)) {
        let m = fieldCodeMap[field_name]
        let value = 0
        for (let i = 0; i < m.length; i += 1) {
            if (m[i] !== undefined) {
                value |= (((code >> m[i]) & 0b1) << i)
            }
        }
        if (field_name === 'imm') {
            value = (value << (64 - m.length)) >> (64 - m.length)
        }
        fieldMap[field_name] = value
    }
    return fieldMap
}

const parseInsn = (insn_name, insn_code, variable_fields, xlen) => {
    const fields_key = variable_fields.join(' ')
    if (!FORMAT_LIST[fields_key]) {
        return null
    }
    const obj = {
        insn_code: format_code(insn_code),
        fields_key: fields_key,
        format: FORMAT_LIST[fields_key]
    }
    let fieldMap = parseFields(obj.format.layout, insn_code, xlen)
    let asm_temp = [...obj.format.asm.matchAll(/\{([^{}]+)\}/g)].map((m) => m[1])
    let asm = obj.format.asm.replace('{insn_name}', insn_name)
    for (let i = 0; i < asm_temp.length; i += 1) {
        let n = asm_temp[i]
        if (n === 'imm' || n === 'uimm') {
            asm = asm.replace(`{${n}}`, fieldMap[n])
        } else {
            asm = asm.replace(`{${n}}`, getABIReg(insn_name, fieldMap[n]))
        }
    }
    obj.asm = asm;
    return obj;
}

export {
    parseInsn,
    FORMAT_LIST
}
