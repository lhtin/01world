import jsyaml from "js-yaml"
import React from "react"
import "./Decoder.css"
import { parseInsn } from './lib/Code'

const decode = (code_hex, instr_dict, xlen) => {
  const insn_code = Number.parseInt(code_hex, 16)
  for (let key of Object.keys(instr_dict.insns)) {
    const insn = instr_dict.insns[key]
    const match = Number.parseInt(insn.match, 16)
    const mask = Number.parseInt(insn.mask, 16)
    if ((insn_code & mask) === match) {
      let insn_name = key.replace(/_/g, '.')
      let info = parseInsn(insn_name, insn_code, insn.variable_fields, xlen, insn.extension[0])
      if (!info) {
        console.log(key, insn)
        return info
      }
      return info
    }
  }
  return null
}

const getInsnDict = (xlen) => {
  return fetch(`./instr_dict_rv${xlen}.yaml`)
    .then((res) => res.text())
    .then((yml) => {
      const obj = jsyaml.load(yml)
      return obj;
    })
}

const Bar = () => {
  return <div className="field-item"></div>
}

const CodeFormat = ({ code, layout }) => {
  const code_len = code.length
  return <div className="code-format">
    <pre className="code-box d-flex flex-column align-items-stretch" style={{ minWidth: '800px' }}>
      <code className="code-index d-flex flex-row text-center">
        {[...Array(code_len).keys()].map((i) => {
          let j = code_len - 1 - i
          return <React.Fragment key={i}>
            <div className="px-1 flex-1">{j}</div>
            {layout.find(info => info.low === j && j !== 0) ? <Bar /> : null}
          </React.Fragment>
        })}
      </code>
      <code className="code-value d-flex flex-row text-center">
        {code.split('')
          .map((a, i) => {
            let j = code_len - 1 - i
            return <React.Fragment key={i}>
              <div className="px-1 flex-1">{a}</div>
              {layout.find(info => info.low === j && j !== 0) ? <Bar /> : null}
            </React.Fragment>
          })}
      </code>
      <code className="code-notation d-flex flex-row text-center">
        {layout.map((field, i) => {
          return <React.Fragment key={i}>
            {i > 0 ? <Bar /> : null}
            <div className={'flex-' + (field.high - field.low + 1)}>{field.name}</div>
          </React.Fragment>
        })}
      </code>
    </pre>
  </div>
}

const Decoder = ({ xlen }) => {
  const [insnDict, setInsnDict] = React.useState(null)
  const [hex, setHex] = React.useState('')
  const [insnInfo, setInsnInfo] = React.useState(null)
  React.useEffect(() => {
    getInsnDict(xlen).then(insnDict => {
      // console.log(insnDict)
      setInsnDict(insnDict)
    })
  }, [xlen])
  React.useEffect(() => {
    if (insnDict) {
      setInsnInfo(decode(hex || "0x258513", insnDict, xlen))
    }
  }, [hex, insnDict, xlen])
  if (!insnDict) {
    return null
  }
  // console.log(insnInfo)
  return <div className="card my-2">
    <div
      className="card-header">
      Decoder<input className="ms-2" placeholder="0x258513" value={hex} onChange={(event) => {
        setHex(event.target.value)
      }} />
    </div>
    {insnInfo ? <div className="card-body">
      <p>extension: {insnInfo.ext}</p>
      <p>assembly: <code>{insnInfo.asm}</code></p>
      <p>layout: </p>
      <CodeFormat code={insnInfo.insn_code} layout={insnInfo.format.layout} />
    </div> : null}
  </div>
}

export {
  Decoder
}
