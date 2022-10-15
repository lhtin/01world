import React from 'react'
import * as marked from "marked"
import { CodeFormater } from './CodeFormater'

const Instruction = ({info, insnInfo}) => {
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
            <p>layout:</p>
            {insnInfo ? <CodeFormater code={insnInfo.insn_code} layout={insnInfo.format.layout} /> : null}
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

export {
    Instruction
}