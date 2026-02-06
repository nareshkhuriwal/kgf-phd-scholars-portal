import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  CartesianGrid, ResponsiveContainer
} from 'recharts';
import { Box, Typography } from '@mui/material';

/* ---------- helpers ---------- */
const flattenMatrix = (data) => {
  if (!data?.matrix || !data?.solutions) return [];

  return data.matrix.map(row => {
    const r = { problem: row.problem };
    data.solutions.forEach(s => {
      r[s] = row[s] ?? 0;
    });
    return r;
  });
};

export default function AnalyticsChart({ type, data }) {
  if (!data) {
    return <Typography variant="body2">No data</Typography>;
  }

  /* ---------- MATRIX / AGGREGATED MATRIX ---------- */
  if (type === 'matrix') {
    const rows = flattenMatrix(data);
    if (!rows.length) return <Typography>No matrix data</Typography>;

    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="problem" hide />
          <YAxis />
          <Tooltip />
          <Legend />
          {data.solutions.map(sol => (
            <Bar key={sol} dataKey={sol} stackId="a" />
          ))}
        </BarChart>
      </ResponsiveContainer>
    );
  }

  /* ---------- BAR ---------- */
  if (type === 'bar') {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={data[0]?.problem ? 'problem' : 'solution'} />
          <YAxis />
          <Tooltip />
          <Bar dataKey="count" />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  /* ---------- STACKED ---------- */
  if (type === 'stacked') {
    const rows = [];
    Object.entries(data).forEach(([problem, items]) => {
      items.forEach(i => {
        rows.push({ problem, solution: i.solution, percentage: i.percentage });
      });
    });

    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="problem" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="percentage" stackId="a" />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  /* ---------- SCATTER (rendered as bar for now) ---------- */
  if (type === 'scatter') {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="problem" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="count" />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return null;
}
