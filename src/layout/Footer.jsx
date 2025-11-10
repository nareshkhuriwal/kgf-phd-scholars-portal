import React from 'react'
import { Box, Typography } from '@mui/material'

export default function Footer() {
  return (
    <Box sx={{ p: 1.5, textAlign: 'center', color: 'text.secondary', fontSize: 12 }}>
      © {new Date().getFullYear()} KGF Scholars Portal
    </Box>
  )
}
