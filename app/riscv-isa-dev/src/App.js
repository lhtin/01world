// import { Decoder } from "./Decoder"
import { ISA } from "./ISA"
import React from 'react'
import "./App.css"

const App = () => {
    // const [tab, setTab] = React.useState('isa');
    return <div className="container py-3">
        {/* <ul className="nav nav-tabs mb-3">
            <li className="nav-item">
                <span className={"nav-link" + (tab === "isa" ? " active" : "")} onClick={() => setTab("isa")}>ISA List</span>
            </li>
            <li className="nav-item">
                <span className={"nav-link" + (tab === "decoder" ? " active" : "")} onClick={() => setTab('decoder')}>Decoder</span>
            </li>
        </ul>
        {tab === "decoder" ? <Decoder /> : null}
        {tab === "isa" ? <ISA /> : null} */}
        <ISA />
    </div>
}

export default App