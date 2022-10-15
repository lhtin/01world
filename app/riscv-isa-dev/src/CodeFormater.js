import React from 'react'

const Bar = () => {
    return <div className="field-item"></div>
  }

const CodeFormater = ({ code, layout }) => {
    const code_len = code.length
    return <div className="code-format">
      <pre className="code-box d-flex flex-column align-items-stretch" style={{ minWidth: '800px' }}>
        <code className="code-index d-flex flex-row text-center">
          {[...Array(code_len).keys()].map((i) => {
            let j = code_len - 1 - i
            return <React.Fragment key={i}>
              <div style={{flex: 1}}>{j}</div>
              {layout.find(info => info.low === j && j !== 0) ? <Bar /> : null}
            </React.Fragment>
          })}
        </code>
        <code className="code-value d-flex flex-row text-center">
          {code.split('')
            .map((a, i) => {
              let j = code_len - 1 - i
              return <React.Fragment key={i}>
                <div style={{flex: 1}}>{a}</div>
                {layout.find(info => info.low === j && j !== 0) ? <Bar /> : null}
              </React.Fragment>
            })}
        </code>
        <code className="code-notation d-flex flex-row text-center">
          {layout.map((field, i) => {
            return <React.Fragment key={i}>
              {i > 0 ? <Bar /> : null}
              <div style={{flex: (field.high - field.low + 1)}}>{field.name}</div>
            </React.Fragment>
          })}
        </code>
      </pre>
    </div>
  }

  export {
    CodeFormater
  }