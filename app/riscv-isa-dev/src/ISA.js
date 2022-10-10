import React from "react"
import * as marked from "marked"
import jsyaml from "js-yaml"
import { Decoder, Encoder } from "./Coder"

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

const parse = (opcode, info) => {
  return {
    name: opcode,
    ...info,
    pseudos: Object.entries(info.pseudos || {}).map(([opcode, info]) => parse(opcode, info))
  };
};

const getISA = () => {
  return fetch('./isa.yml')
    .then((res) => res.text())
    .then((yml) => {
      const obj = jsyaml.load(yml);
      const ISA = {
        RV32: {},
        RV64: {},
      }
      // RV32
      Object.entries(obj).forEach(([ext, info]) => {
        if (ext === "HELPER" || ext === "RV64I") {
          return;
        } else if (ext === "RV32I") {
          ext = "I"
        }
        ISA.RV32[ext] = {
          name: ext,
          meta: info["meta"],
          insns: []
        }
        // console.log(info)
        Object.entries(info).forEach(([opcode, info]) => {
          if (opcode === "meta" || info.rv64_only) {
            return;
          } else if (info.only_base && !info.only_base.includes('RV32')) {
            return;
          }
          ISA.RV32[ext].insns.push(parse(opcode, info))
        })
      })
      // RV64
      Object.entries(obj).forEach(([ext, info]) => {
        if (ext === "HELPER" || ext === "RV32I") {
          return;
        } else if (info.only_base && !info.only_base.includes('RV64')) {
          return;
        } else if (ext === "RV64I") {
          ext = "I"
        }
        ISA.RV64[ext] = {
          name: ext,
          meta: info["meta"],
          insns: []
        }
        // console.log(info)
        Object.entries(info).forEach(([opcode, info]) => {
          if (opcode === "meta" || info.rv32_only) {
            return;
          }
          ISA.RV64[ext].insns.push(parse(opcode, info))
        })
      })
      // console.log(ISA)
      return ISA
    })
}

// const formatExts = (extSet) => {
//   const str = Array.from(extSet)
//     .sort((a, b) => a.length - b.length)
//     .map(ext => (ext.length > 1 ? `_` : '') + ext)
//     .join("");
//   return str.replace(new RegExp(`^_+`), "");
// };

const Instruction = ({info}) => {
  return (
    <div className="insn my-2">
      <div className="asm">
        <strong><code>{info['asm']}</code></strong>
      </div>
      {info['real'] ? <div className="mt-2">
          <code>{info['real']}</code>
        </div> : null}
      <div className="mt-2">
        {info['desc'] ? <div className="insn-desc">{info['desc'].split("\n").map((line, index) => (
          <div key={index} dangerouslySetInnerHTML={{__html: marked.parse(line)}}></div>
        ))}</div> : null}
        {info['code'] ? <pre className="gray-box mt-2">
          <code>{info['code']}</code>
        </pre> : null}
        {info['pseudos'].length > 0
          ? <div className="mt-2">
          <div><strong>Pseudoinstructions:</strong></div>
          <div className="mt-2 ms-2">
            {info['pseudos'].map((info, index) => (
                <div key={info.name} className="mt-4">
                  <div className="asm">
                    <strong><code>{info['asm']}</code></strong>
                  </div>
                  <div className="mt-2">
                    <code>{info['real']}</code>
                  </div>
                  <div className="mt-2">{info['desc']}</div>
                  {info['code'] ? <pre className="gray-box mt-2">
                    <code>{info['code']}</code>
                  </pre> : null}
                </div>
              ))}
            </div>
          </div>
          : null}
      </div>
    </div>
  )
}

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
  const [xlen, setXLEN] = React.useState("RV32");
  const [ISA, setISA] = React.useState(null);
  const [extVisible, setExtVisible] = React.useState({});
  const [extSet, setExtSet] = React.useState(new Set(G_EXTENSIONS));
  React.useEffect(() => {
    getISA().then(ISA => {
      setISA(ISA);
    })
  }, []);
  if (!ISA) {
    return null;
  }
  return <div className="container">
    <h1 className="row row-no-gutters">List of RISC-V Instructions</h1>
    <div className="row row-no-gutters my-2">
      <div className="col-xs-4 col-md-2">
        <label>
          <input className="me-2" type="radio" checked={xlen === "RV32"} onChange={() => setXLEN("RV32")} />
          RV32
        </label>
      </div>
      <div className="col-xs-4 col-md-2">
        <label>
          <input className="me-2" type="radio" checked={xlen === "RV64"} onChange={() => setXLEN("RV64")} />
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
            {ext} ({ISA[xlen][ext].insns.length})
          </label>
        </div>
      ))}
    </div>
    <Decoder xlen={xlen === 'RV32' ? 32 : 64}></Decoder>
    <Encoder xlen={xlen === 'RV32' ? 32 : 64}></Encoder>
    <div className="card">
      <div className="card-header">Notations</div>
      <div className="card-body">
        <pre className="gray-box"><code>{notation}</code></pre>
      </div>
    </div>
    <p><small>Note: The descriptions of the instructions are mostly from <a href="https://riscv.org/technical/specifications/">the RISC-V ISA specification</a>.</small></p>
    {ISA
      ? Array.from(RISCV_EXTENSIONS).filter(ext => extSet.has(ext)).map(ext => ISA[xlen][ext]).map(extInfo => (
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
                      <Instruction info={info} />
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
