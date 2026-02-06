import React, { useEffect } from 'react';
import { Box, Grid, CircularProgress, Alert } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';

import PageHeader from '../../components/PageHeader';
import AnalyticsCard from '../../components/analytics/AnalyticsCard';
import { loadAnalyticsOverview } from '../../store/reportsSlice';

const REPORT_CARDS = [
    { key: 'cooccurrence_matrix', title: 'Problem × Solution Matrix', type: 'matrix' },
  { key: 'aggregated_matrix', title: 'Aggregated ROL Matrix', type: 'matrix' },

  { key: 'cooccurrence',        title: 'Problem × Solution Co-occurrence', type: 'matrix' },
  { key: 'problemCounts',       title: 'Problem Counts',                  type: 'bar' },
  { key: 'solutionCounts',      title: 'Solution Counts',                 type: 'bar' },
  { key: 'rowPercentages',      title: 'Row-wise Percentages',             type: 'stacked' },
  { key: 'dominantSolutions',   title: 'Dominant Solutions',               type: 'bar' },
  { key: 'underexploredGaps',   title: 'Underexplored Gaps',               type: 'scatter' },
];

export default function AnalyticsDashboard() {
  const dispatch = useDispatch();

  const {
    loading,
    error,
  cooccurrence,
  cooccurrence_matrix,
  aggregated_matrix,

  problemCounts,
    solutionCounts,
    rowPercentages,
    dominantSolutions,
    underexploredGaps,
  } = useSelector(s => s.reports.analytics);

  useEffect(() => {
    dispatch(loadAnalyticsOverview());
  }, [dispatch]);

  if (loading) {
    return (
      <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  const dataMap = {
  cooccurrence,
  cooccurrence_matrix,
  aggregated_matrix,

  problemCounts,
    solutionCounts,
    rowPercentages,
    dominantSolutions,
    underexploredGaps,
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      <PageHeader
        title="Analytics Reports"
        subtitle="Problem–solution insights derived from reviewed literature"
      />

      <Grid container spacing={1.5}>
        {REPORT_CARDS.map(card => (
          <Grid key={card.key} item xs={12} md={6} lg={4}>
            <AnalyticsCard
              title={card.title}
              type={card.type}
              data={dataMap[card.key]}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
