// ─────────────────────────────────────────────────────────────────────────────
// src/pages/reports/ReportsPage.jsx
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react';
import { Box, Tabs, Tab, Paper } from '@mui/material';
import { useSelector } from 'react-redux';
import ReportBuilder from '../../components/reports/ReportBuilder';
import BulkExports from '../../components/reports/BulkExports';
// import { selectRole } from '../../store/authSlice';

export default function ReportsPage() {
  const role = 'admin'; // 'admin' | 'reviewer' | 'supervisor' | 'researcher'
  const [tab, setTab] = React.useState(0);

  const canBulk = role === 'admin' || role === 'supervisor';

  return (
    <Paper elevation={0} sx={{ p: 2 }}>
      <Tabs value={tab} onChange={(_,v)=>setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Build Report" />
        {canBulk && <Tab label="Bulk Exports" />}
      </Tabs>
      <Box hidden={tab !== 0}>
        <ReportBuilder />
      </Box>
      {canBulk && (
        <Box hidden={tab !== 1}>
          <BulkExports />
        </Box>
      )}
    </Paper>
  );
}