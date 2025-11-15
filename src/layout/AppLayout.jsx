// src/layout/AppLayout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box, Toolbar } from '@mui/material';
import Header from './Header';
import Sidebar from './Sidebar';

export default function AppLayout() {
  const [open, setOpen] = React.useState(false);
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f6f7fb' }}>
      <Header onToggleSidebar={() => setOpen(v => !v)} />
      <Sidebar open={open} />
      <Box component="main" sx={{ flexGrow: 1, p: 2, pt: 1.5, overflow: 'hidden' }}>
        <Toolbar variant="regular" />
        <Outlet />
      </Box>
    </Box>
  );
}
