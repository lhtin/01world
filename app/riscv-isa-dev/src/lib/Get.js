import jsyaml from "js-yaml"

const parse = (opcode, info) => {
  return {
    name: opcode,
    ...info,
    pseudos: Object.entries(info.pseudos || {}).map(([opcode, info]) => parse(opcode, info))
  };
};

const getISA = () => {
    return fetch('./ISA.yml')
    .then((res) => res.text())
    .then((yml) => jsyaml.load(yml))
}
const getISA1 = () => {
    return getISA().then((obj) => {
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
            if (info.only_base) console.log(info.only_base)
            ISA.RV32[ext].insns.push(parse(opcode, info))
          })
        })
        // RV64
        Object.entries(obj).forEach(([ext, info]) => {
          if (ext === "HELPER" || ext === "RV32I") {
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
            } else if (info.only_base && !info.only_base.includes('RV64')) {
              return;
            }
            if (info.only_base) console.log(info.only_base)
            ISA.RV64[ext].insns.push(parse(opcode, info))
          })
        })
        // console.log(ISA)
        return ISA
      })
}

const getInsnDict = (xlen) => {
    return fetch(`./instr_dict_rv${xlen}.yaml`)
      .then((res) => res.text())
      .then((yml) => {
        const obj = jsyaml.load(yml)
        return obj;
      })
  }
  const getFormatList = () => {
    return fetch(`./FORMAT_LIST.yaml`)
      .then((res) => res.text())
      .then((yml) => {
        const obj = jsyaml.load(yml)
        return obj;
      })
  }

export {
    getISA,
    getISA1,
    getInsnDict,
    getFormatList
}