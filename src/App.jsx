import React from 'react'
import Router from './router'

export default function App() {
  return (
    <div style={{minHeight:'100vh', display:'flex', flexDirection:'column'}}>
      <div style={{flex:1}}>
        <Router />
      </div>
    </div>
  )
}
