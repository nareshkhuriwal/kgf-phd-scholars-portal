import React from 'react'
import Router from './router'
import NavBar from './components/NavBar'

export default function App() {
  return (
    <div style={{minHeight:'100vh', display:'flex', flexDirection:'column'}}>
      <NavBar />
      <div style={{flex:1}}>
        <Router />
      </div>
    </div>
  )
}
