import React from "react"
import "./Coder.css"
import { Instruction } from "./Instr"
import { encode, decode } from './lib/Code'
import { CodeFormater } from "./CodeFormater"

const Decoder = ({ insnDict, formatList, hiddenDetail = false}) => {
  const [hex, setHex] = React.useState('')
  const [insnInfo, setInsnInfo] = React.useState(null)
  const [hidden, setHidden] = React.useState(hiddenDetail)
  React.useEffect(() => {
    if (insnDict && formatList) {
      setInsnInfo(decode(hex || "0x258513", insnDict, formatList))
    }
  }, [hex, insnDict, formatList])
  // console.log(insnInfo)
  return <div className="card my-2">
    <div
      className="card-header d-flex align-items-center" onClick={() => {
        setHidden(!hidden)
      }}>
      <span>Decoder</span>
      <input className="ms-2" placeholder="0x258513" value={hex} onChange={(event) => {
        setHex(event.target.value)
      }} />
      <span style={{transform: hidden ? "rotate(0deg)" : "rotate(90deg)"}} className="ms-2 icon-expand"></span>
    </div>
    {(insnInfo && !hidden) ? <div className="card-body">
      <p>extension: {insnInfo.ext}</p>
      <p>assembly: <code>{insnInfo.asm}</code></p>
      <p>layout: </p>
      <CodeFormater code={insnInfo.insn_code} layout={insnInfo.format.layout} />
    </div> : null}
  </div>
}

const Encoder = ({ insnName = '', insnDict, formatList, ISA, xlen, canFull = false, hiddenDetail = false }) => {
  const [insnInfo, setInsnInfo] = React.useState(null)
  const isa = Object.values(ISA["RV" + xlen]).map((item) => item.insns).flat()
  const [name, setName] = React.useState(insnName)
  const [hidden, setHidden] = React.useState(hiddenDetail)
  React.useEffect(() => {
    if (insnDict && formatList) {
      setInsnInfo(encode(name || "addi", insnDict, formatList))
    }
  }, [name, insnDict, formatList])
  return <div className="card my-2">
    <div
      className="card-header d-flex">
      <div className="flex-1 d-flex align-items-center" onClick={() => {
        setHidden(!hidden)
      }}>
        <span>Encoder</span>
        <input className="ms-2" placeholder="addi" value={name} onChange={(event) => {
          setName(event.target.value)
        }} />
        <span style={{transform: hidden ? "rotate(0deg)" : "rotate(90deg)"}} className="ms-2 icon-expand"></span>
      </div>
      {(canFull && !hidden)
        ? <button onClick={() => {
          const query = new URLSearchParams(window.location.search)
          query.set("insn_name", name || "addi")
          query.set("xlen", xlen)
          window.location.search = query.toString()
        }} type="button" className="btn btn-outline-primary btn-sm">Full Screen</button> 
        : null}
    </div>
    {(insnInfo && !hidden) ? <>
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
