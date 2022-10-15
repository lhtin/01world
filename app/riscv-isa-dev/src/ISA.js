import React from "react"
import { Decoder, Encoder } from "./Coder"
import { Back } from "./components/Back";
import { Instruction } from "./Instr"
import { encode } from "./lib/Code";
import { getFormatList, getInsnDict, getISA1 } from "./lib/Get";
const RISCV_EXTENSIONS = new Set([
  "I", "M", "A", "F", "D", "C",  "Zicsr", "Zifencei"
]);

const G_EXTENSIONS = new Set([
  "I", "M", "A", "F", "D", "Zicsr", "Zifencei"
]);

const isAll = (extSet) => extSet.size === RISCV_EXTENSIONS.size;

const hasG = (extSet) => Array.from(G_EXTENSIONS).every((ext) => extSet.has(ext));

const toggle = (extSet, ext) => {
  if (ext === "all") {
    if (isAll(extSet)) {
      return new Set();
    } else {
      return RISCV_EXTENSIONS;
    }
  } else if (ext === "g") {
    if (Array.from(G_EXTENSIONS).every((ext) => extSet.has(ext))) {
      return new Set(Array.from(extSet).filter((ext) => !G_EXTENSIONS.has(ext)));
    } else {
      return new Set([...extSet, ...G_EXTENSIONS]);
    }
  } else if (extSet.has(ext)) {
    const newExtSet = new Set(extSet);
    newExtSet.delete(ext);
    return newExtSet;
  } else {
    const newExtSet = new Set(extSet);
    newExtSet.add(ext);
    return newExtSet;
  }
};

const notation = `\
  rd, rs1, rs2: [x0, x31]
         imm12: [-2^11, 2^11-1] i.e. [-2048, 2047]
         imm20: [-2^19, 2^19-1] i.e. [-524288, 524287]
         uimm5: [0, 2^5-1] i.e. [0, 31]
         uimm6: [0, 2^6-1 i.e. [0, 63]
  x, signed(x): default treated x as a signed number
   unsigned(x): treated x as a unsigned number
sign_extend(x): sign extend x to XLEN bits number
`

const ISA = () => {
  const query = new URLSearchParams(window.location.search)
  const [xlen, setXLEN] = React.useState(query.get("xlen") ? Number(query.get("xlen")) : 32);
  const [ISA, setISA] = React.useState(null);
  const [insnDict, setInsnDict] = React.useState(null)
  const [formatList, setFormatList] = React.useState(null)
  const [extVisible, setExtVisible] = React.useState({});
  const [extSet, setExtSet] = React.useState(new Set(G_EXTENSIONS));
  React.useEffect(() => {
    Promise.all([
      getInsnDict(xlen),
      getFormatList(),
      getISA1()
    ]).then(([insnDict, formatList, ISA]) => {
      setInsnDict(insnDict)
      setFormatList(formatList)
      setISA(ISA)
    })
  }, [xlen])
  React.useEffect(() => {
    const url = new URL(window.location);
    url.searchParams.set('xlen', xlen);
    window.history.pushState({}, '', url);
  }, [xlen])
  if (!ISA) {
    return null;
  }
  if (query.has("insn_name")) {
    return <div className="container">
      <Back onClick={() => {
        query.delete("insn_name")
        window.location.search = query.toString()
      }} desc={"Home"} />
      <Encoder insnName={query.get("insn_name")} xlen={xlen} insnDict={insnDict} formatList={formatList} ISA={ISA}></Encoder>
    </div>
  }
  return <div className="container">
    <h1 className="row row-no-gutters">List of RISC-V Instructions</h1>
    <div className="row row-no-gutters my-2">
      <div className="col-xs-4 col-md-2">
        <label>
          <input className="me-2" type="radio" checked={xlen === 32} onChange={() => setXLEN(32)} />
          RV32
        </label>
      </div>
      <div className="col-xs-4 col-md-2">
        <label>
          <input className="me-2" type="radio" checked={xlen === 64} onChange={() => setXLEN(64)} />
          RV64
        </label>
      </div>
    </div>
    <div className="d-flex flex-row flex-wrap my-2">
      <div className="me-4">
        <label>
          <input type="checkbox" className="me-2" checked={isAll(extSet)} onChange={() => setExtSet(toggle(extSet, "all"))} />
          All
        </label>
      </div>
      <div className="me-4">
        <label>
          <input type="checkbox" className="me-2" checked={hasG(extSet)} onChange={() => setExtSet(toggle(extSet, "g"))} />
          G
        </label>
      </div>
      {Array.from(RISCV_EXTENSIONS).map(ext => (
        <div className="me-4" key={ext}>
          <label>
            <input type="checkbox" className="me-2" checked={extSet.has(ext)} onChange={() => setExtSet(toggle(extSet, ext))} />
            {ext} ({ISA["RV" + xlen][ext].insns.length})
          </label>
        </div>
      ))}
    </div>
    <Decoder xlen={xlen} insnDict={insnDict} formatList={formatList}></Decoder>
    <Encoder xlen={xlen} insnDict={insnDict} formatList={formatList} ISA={ISA} canFull={true}></Encoder>
    <div className="card">
      <div className="card-header">Notations</div>
      <div className="card-body">
        <pre className="gray-box"><code>{notation}</code></pre>
      </div>
    </div>
    <p><small>Note: The descriptions of the instructions are mostly from <a href="https://riscv.org/technical/specifications/">the RISC-V ISA specification</a>.</small></p>
    {ISA
      ? Array.from(RISCV_EXTENSIONS).filter(ext => extSet.has(ext)).map(ext => ISA["RV" + xlen][ext]).map(extInfo => (
        <div key={extInfo.name} className="card my-2">
          <div
            className="card-header"
            onClick={() => {
              setExtVisible({
                ...extVisible, 
                [extInfo.name]: !(extVisible[extInfo.name] || extVisible[extInfo.name] === undefined)
              })
            }} >
              <h3 className="">
                <strong>{extInfo.name}</strong>
                <small>&nbsp;&nbsp;&nbsp;&nbsp;{extInfo.meta?.version}</small>
              </h3>
              {extInfo.meta?.desc ? <div className="mt-2"><small>{extInfo.meta.desc}</small></div> : null}
          </div>
          {extVisible[extInfo.name] === false 
            ? null 
            : <>
                {extInfo.meta.notations ? <div className="card m-2">
                  <div className="card-header">Notations</div>
                  <div className="card-body">
                    <pre className="gray-box"><code>{extInfo.meta.notations}</code></pre>
                  </div>
                </div> : null}
                <ul className="list-group list-group-flush">
                  {extInfo.insns.map((info) => (
                    <li key={info.name} className="list-group-item">
                      <Instruction info={info} insnInfo={encode(info.name.toLowerCase(), insnDict, formatList)} />
                    </li>
                  ))}
                </ul>
              </>}
          </div>
    )) : null}
  </div>
};

export {
  ISA
};
