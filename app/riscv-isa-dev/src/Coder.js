import React from "react"
import "./Coder.css"
import { Instruction } from "./Instr"
import { encode, decode } from './lib/Code'
import { CodeFormater } from "./CodeFormater"

const Decoder = ({ insnDict, formatList, xlen }) => {
  const [hex, setHex] = React.useState('')
  const [insnInfo, setInsnInfo] = React.useState(null)
  React.useEffect(() => {
    if (insnDict && formatList) {
      setInsnInfo(decode(hex || "0x258513", insnDict, xlen, formatList))
    }
  }, [hex, insnDict, xlen, formatList])
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
      <CodeFormater code={insnInfo.insn_code} layout={insnInfo.format.layout} />
    </div> : null}
  </div>
}

const Encoder = ({ insnDict, formatList, ISA, xlen }) => {
  const [insnInfo, setInsnInfo] = React.useState(null)
  const isa = Object.values(ISA["RV" + xlen]).map((item) => item.insns).flat()
  const [name, setName] = React.useState('')
  React.useEffect(() => {
    if (insnDict && formatList) {
      setInsnInfo(encode(name || "addi", insnDict, xlen, formatList))
    }
  }, [name, insnDict, xlen, formatList])
  return <div className="card my-2">
    <div
      className="card-header">
      Encoder<input className="ms-2" placeholder="addi" value={name} onChange={(event) => {
        setName(event.target.value)
      }} />
    </div>
    {insnInfo ? <>
      <div className="card-body">
        <p>extension: {insnInfo.ext}</p>
        <Instruction info={isa.find((item) => item.name.toLowerCase() === insnInfo.insn_name)} insnInfo={insnInfo} />
        {/* <p>assembly: <code>{insnInfo.asm}</code></p>
        <p>layout: </p>
        <CodeFormat code={insnInfo.insn_code} layout={insnInfo.format.layout} /> */}
      </div>
    </> : null}
  </div>
}

export {
  Decoder,
  Encoder
}
