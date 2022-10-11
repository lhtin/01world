import {FORMAT_LIST} from './CodeFormat'

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

const getRoundingMode = (rm) => {
    return ['RNE', 'RTZ', 'RDN', 'RUP', 'RMN', '', '', 'DYN'][rm]
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

const parseFields = (layout, code, xlen) => {
    let fieldCodeMap = {}
    let filedInfoMap = {}
    for (let field of layout) {
        let result = /^([^[\]]+)(?:\[([0-9:|]+)\])?$/.exec(field.name)
        let field_name = result[1]
        filedInfoMap[field] = field
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
        // console.assert(filedInfoMap[field_name].not_value && !filedInfoMap[field_name].not_value.includes(value), `${field_name} cann't be ${value}`)
        // console.assert(filedInfoMap[field_name].value && filedInfoMap[field_name].value.includes(value), `${field_name} must be ${filedInfoMap[field_name].value}, but get ${value}`)
    }
    return fieldMap
}

const asm_handlers = {
    '_aqrl_': (fieldMap) => {
        let ordering = (fieldMap['aq'] ? 'aq' : '') + (fieldMap['rl'] ? 'rl' : '')
        return ordering ? ('.' + ordering) : ''
    }
}

const parseInsn = (insn_name, insn_code, variable_fields, xlen, ext, decoding = false) => {
    if (ext.endsWith("_c")) {
        insn_code = insn_code.slice(-16)
    }
    const fields_key = variable_fields.join(' ')
    let format = null
    for (let item of Object.values(FORMAT_LIST)) {
        if (item.ext.includes(ext)) {
            format = item[fields_key]
            break
        }
    }
    if (!format) {
        console.log("fields_key", fields_key)
        return null
    }
    const obj = {
        ext: ext,
        insn_code: insn_code,
        fields_key: fields_key,
        format: format
    }
    if (decoding) {
        let fieldMap = parseFields(obj.format.layout, Number.parseInt(insn_code, 2), xlen)
        let asm_temp = [...obj.format.asm.matchAll(/\{([^{}]+)\}/g)].map((m) => m[1])
        let asm = obj.format.asm.replace('{insn_name}', insn_name)
        for (let i = 0; i < asm_temp.length; i += 1) {
            let n = asm_temp[i]
            switch (n) {
                case 'imm':
                case 'uimm':
                    asm = asm.replace(`{${n}}`, fieldMap[n])
                    break;
                case 'rm':
                    asm = asm.replace(`{${n}}`, getRoundingMode(fieldMap[n]))
                    break;
                case '_aqrl_':
                    asm = asm.replace(`{${n}}`, asm_handlers[n](fieldMap))
                    break;
                default:
                    asm = asm.replace(`{${n}}`, getABIReg(insn_name, fieldMap[n]))
            }
        }
        obj.asm = asm;
    } else {
        let asm = obj.format.asm.replace('{insn_name}', insn_name)
        obj.asm = asm.replace(/\{|\}/g, '')
    }
    return obj;
}

export {
    parseInsn,
    FORMAT_LIST,
    format_code
}
