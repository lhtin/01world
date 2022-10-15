import React from 'react'

const Back = ({onClick, desc = "Back"}) => {
    return <button type="button" className="btn btn-outline-primary btn-sm" onClick={onClick}>← {desc}</button>
}

export {
    Back
}