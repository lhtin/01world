import jsyaml from "js-yaml"
import React from "react"
import "./Decoder.css"

const parseField = (insn_name, insn_code, variable_fields, meta) => {
  const obj = {
    insn_code: format_code(insn_code)
  }
  for (let field of variable_fields) {
      // console.log(meta[field])
      let range = meta[field].sort((a, b) => a - b)
      console.log(field, range)
      let value = (insn_code >> range[0]) & (Math.pow(2, range[1] - range[0] + 1) - 1)
      obj[field] = value;
  }
  if (obj.imm12 !== undefined) {
    obj.imm12_sign = (obj.imm12 << 52) >> 52
    obj.type = 'I-type'
    obj.asm = `${insn_name} x${obj.rd}, x${obj.rs1}, x${obj.imm12_sign}`
  } else if (obj.bimm12hi !== undefined && obj.bimm12lo !== undefined ) {
    let imm12 = ((obj.bimm12hi & 0b1000000) << 5) 
      | ((obj.bimm12hi & 0b111111) << 5)
      | ((obj.bimm12lo & 0b11110) >> 1)
      | ((obj.bimm12lo & 0b1) << 10)
    obj.imm13_sign = (imm12 << 52) >> 51
    obj.type = 'B-type'
    obj.asm = `${insn_name} x${obj.rs1}, x${obj.rs2}, ${obj.imm13_sign}`
  } else if (obj.imm12hi !== undefined && obj.imm12lo !== undefined) {
    let imm12 = (obj.imm12hi << 5) | obj.imm12lo
    obj.imm12_sign = (imm12 << 52) >> 52
    obj.type = 'S-type'
    obj.asm = `${insn_name} x${obj.rs2}, x${obj.rs1}, ${obj.imm12_sign}`
  } else if (obj.imm20 !== undefined) {
    obj.imm20_sign = (obj.imm20 << 44) >> 32
    obj.type = 'U-type'
    obj.asm = `${insn_name} x${obj.rd}, ${obj.imm20_sign}`
  } else if (obj.jimm20 !== undefined) {
    let imm20 = (obj.jimm20 & 0b10000000000000000000)
      | ((obj.jimm20 & 0b1111111111000000000) >> 9)
      | ((obj.jimm20 & 0b100000000) << 2)
      | ((obj.jimm20 & 0b11111111) << 11)
    obj.imm21_sign = (imm20 << 44) >> 43
    obj.type = 'J-type'
    obj.asm = `${insn_name} x${obj.rd}, ${obj.imm21_sign}`
  } else {
    obj.type = 'R-type'
    obj.asm = `${insn_name} x${obj.rd}, ${obj.rs1}, ${obj.rs2}`
  }
  return obj;
}

const format_code = (code) => {
  let bin = code.toString(2)
  if ((code & 0b11) !== 0b11) {
    bin = bin.padStart(16, '0')
    throw new Error('not support Compressed extension current.')
  } else if ((code & 0b11100) !== 0b11100) {
    bin = bin.padStart(32, '0')
  }
  console.log(bin)
  let str = ""
  let str2 = ""
  let count = 0
  let pad = [" ", " ", "  ", "  ", " ", "  ", "  "]
  let pad_i = 0
  for (let i = bin.length - 1; i >= 0; i -= 1) {
    if (count === 4) {
      str = " " + str
      str2 = pad[pad_i] + str2
      count = 0
      pad_i += 1
    }
    str = bin[i] + str
    str2 = bin[i] + " " + str2
    count += 1
  }
  return str2
}

const decode = (code_hex, instr_dict) => {
  const insn_code = Number.parseInt(code_hex, 16)
  for (let key of Object.keys(instr_dict.insns)) {
      const insn = instr_dict.insns[key]
      const match = Number.parseInt(insn.match, 16)
      const mask = Number.parseInt(insn.mask, 16)
      if ((insn_code & mask) === match) {
          console.log(insn.match)
          console.log(insn_code.toString(2))
          let info = parseField(key, insn_code, insn.variable_fields, instr_dict.meta)
          return info
      }
  }
  return null
}
  
const getInsnDict = (xlen) => {
  return fetch(`./instr_dict_${xlen.toLowerCase()}.yaml`)
    .then((res) => res.text())
    .then((yml) => {
      const obj = jsyaml.load(yml)
      return obj;
    })
}

const Bar = () => {
  return <div className="field-item"></div>
}

const tpl = {
  'R-type': [
    {name: 'funct7', start: 31, end: 25},
    {name: 'rs2', start: 24, end: 20, },
    {name: 'rs1', start: 19, end: 15, },
    {name: 'funct3', start: 14, end: 12, },
    {name: 'rd', start: 11, end: 7, },
    {name: 'opcode', start: 6, end: 0 }
  ],
  'I-type': [
    {name: 'imm[11:0]', start: 31, end: 20},
    {name: 'rs1', start: 19, end: 15, },
    {name: 'funct3', start: 14, end: 12, },
    {name: 'rd', start: 11, end: 7, },
    {name: 'opcode', start: 6, end: 0 }
  ],
  'S-type': [
    {name: 'imm[11:5]', start: 31, end: 25},
    {name: 'rs2', start: 24, end: 20, },
    {name: 'rs1', start: 19, end: 15, },
    {name: 'funct3', start: 14, end: 12, },
    {name: 'imm[4:0]', start: 11, end: 7, },
    {name: 'opcode', start: 6, end: 0 }
  ],
  'B-type': [
    {name: "imm[12|10:5]", start: 31, end: 25 },
    {name: 'rs2', start: 24, end: 20, },
    {name: 'rs1', start: 19, end: 15, },
    {name: 'funct3', start: 14, end: 12, },
    {name: 'imm[4:1|11]', start: 11, end: 7, },
    {name: 'opcode', start: 6, end: 0 }
  ],
  'U-type': [
    {name: "imm[31:12]", start: 31, end: 12, },
    {name: 'rd', start: 11, end: 7, },
    {name: 'opcode', start: 6, end: 0 }
  ],
  'J-type': [
    {name: "imm[20|10:1|11|19:12]", start: 31, end: 12, },
    {name: 'rd', start: 11, end: 7, },
    {name: 'opcode', start: 6, end: 0 }
  ],
}

const Decoder = ({xlen}) => {
  const [insnDict, setInsnDict] = React.useState(null)
  const [insnInfo, setInsnInfo] = React.useState(null)
  React.useEffect(() => {
    getInsnDict(xlen).then(insnDict => {
      console.log(insnDict)
      setInsnDict(insnDict)
    })
  }, [xlen])
  if (!insnDict) {
    return null
  }
  return <div className="card my-2">
  <div
    className="card-header">
    Decoder<input className="ms-2" placeholder="input hex code" onChange={(event) => {
      setInsnInfo(decode(event.target.value, insnDict))
    }} />
  </div>
    {insnInfo ? <div className="card-body">
      <p>Type: {insnInfo.type}</p>
      <p>assembly: <code>{insnInfo.asm}</code></p>
      <pre className="d-flex flex-column align-items-stretch">
        <code className="d-flex flex-row text-center" style={{fontSize: '9px'}}>
          {[...Array(32).keys()].map((i) => {
            let j = 31 - i
            return <React.Fragment key={i}>
              <div className="px-1 flex-1">{j}</div>
              {tpl[insnInfo.type].find(info => info.end === j  && j !== 0) ? <Bar /> : null}
            </React.Fragment>
          })}
        </code>
        <code className="d-flex flex-row text-center">
          {insnInfo.insn_code.split(' ')
            .filter((a => a !== ""))
            .map((a, i) => {
              let j = 31 - i
              return <React.Fragment key={i}>
                <div className="px-1 flex-1">{a}</div>
                {tpl[insnInfo.type].find(info => info.end === j  && j !== 0) ? <Bar /> : null}
              </React.Fragment>
            })}
        </code>
        <code className="d-flex flex-row text-center">
          {tpl[insnInfo.type].map((field, i) => {
            return <React.Fragment key={i}>
              {i > 0 ? <Bar /> : null}
              <div className={'flex-' + (field.start - field.end + 1)}>{field.name}</div>
            </React.Fragment>
          })}
        </code>
      </pre>
    </div> : null}
  </div>
}

export {
  Decoder
}