import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';
import { Typography } from '@mui/material';

/* ================= CONSTANTS ================= */
const COLORS = ['#1976d2', '#9c27b0', '#ed6c02', '#2e7d32'];
const BAR_HEIGHT = 22;
const BAR_GAP = 14;

/* ================= HELPERS ================= */

// Dynamic left margin based on label length
function calcLeftMargin(rows = []) {
  if (!rows.length) return 20;

  const longest = Math.max(
    ...rows.map(r =>
      String(r.problem || r.solution || r.label || '').length
    )
  );

  return Math.max(20, longest);

}

// Wrap long Y-axis labels
const wrapLabel = (text, max = 26) => {
  if (!text) return '';
  const words = text.split(' ');
  const lines = [];
  let line = '';

  words.forEach(w => {
    if ((line + ' ' + w).length > max) {
      lines.push(line);
      line = w;
    } else {
      line = line ? `${line} ${w}` : w;
    }
  });

  if (line) lines.push(line);
  return lines.join('\n');
};

// Chart height based on number of rows
const calcHeight = (rows = 1) =>
  Math.max(rows * (BAR_HEIGHT + BAR_GAP), 220);

/* ================= MATRIX FLATTENER ================= */

const flattenMatrix = (data) => {
  if (!data?.matrix || !data?.solutions) return [];

  return data.matrix.map(row => {
    const r = { problem: row.problem };
    data.solutions.forEach(s => {
      r[s] = Number(row[s] ?? 0);
    });
    return r;
  });
};

/* ================= COMPONENT ================= */

export default function AnalyticsChart({ type, data }) {
  if (!data || (Array.isArray(data) && data.length === 0)) {
    return <Typography variant="body2">No data</Typography>;
  }

  /* ======================================================
     MATRIX / AGGREGATED MATRIX
     ====================================================== */
  if (type === 'matrix') {
    const rows = flattenMatrix(data);
    if (!rows.length) {
      return <Typography variant="body2">No matrix data</Typography>;
    }

    return (
     <ResponsiveContainer width="100%" height={calcHeight(rows.length)}>
  <BarChart
    data={rows}
    layout="vertical"
    margin={{
      top: 8,
      right: 20,
      left: calcLeftMargin(rows),
      bottom: 8,
    }}
    barCategoryGap={BAR_GAP}
  >
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis
      type="number"
      domain={[0, 'dataMax']}
      allowDecimals={false}
    />
    <YAxis
      type="category"
      dataKey="problem"
      padding={{ top: 0, bottom: 0 }}
      tick={{ fontSize: 11 }}
      tickFormatter={wrapLabel}
    />
    <Tooltip />
    {data.solutions.map((s, i) => (
      <Bar
        key={s}
        dataKey={s}
        stackId="a"
        fill={COLORS[i % COLORS.length]}
        barSize={BAR_HEIGHT}
      />
    ))}
  </BarChart>
</ResponsiveContainer>

    );
  }

  /* ======================================================
     BAR (Problem Counts / Solution Counts / Dominant)
     ====================================================== */
  if (type === 'bar') {
    let rows = [];

    // CASE 1: aggregated from matrix
    if (data?.matrix) {
      rows = data.matrix.map(r => ({
        problem: r.problem,
        count: Object.entries(r)
          .filter(([k]) => k !== 'problem')
          .reduce((s, [, v]) => s + Number(v || 0), 0),
      }));
    }
    // CASE 2: simple bar data
    else if (Array.isArray(data)) {
      rows = data;
    }

    if (!rows.length) {
      return <Typography variant="body2">No data</Typography>;
    }

    const isProblem = Boolean(rows[0]?.problem);
    const left = isProblem ? calcLeftMargin(rows) : 60;

    return (
      <ResponsiveContainer width="100%" height={calcHeight(rows.length)}>
        <BarChart
          data={rows}
          layout={isProblem ? 'vertical' : 'horizontal'}
          margin={{ top: 10, right: 20, left, bottom: 30 }}
          barCategoryGap={BAR_GAP}
        >
          <CartesianGrid strokeDasharray="3 3" />

          {isProblem ? (
            <>
              <XAxis
  type="number"
  domain={[0, 'dataMax']}
  allowDecimals={false}
/>

              <YAxis
                type="category"
                dataKey="problem"
  padding={{ top: 0, bottom: 0 }}
                tick={{ fontSize: 11 }}
                tickFormatter={wrapLabel}
              />
            </>
          ) : (
            <>
              <XAxis
                dataKey="solution"
                interval={0}
                angle={-20}
                textAnchor="end"
                height={70}
              />
              <YAxis type="number" 
  padding={{ top: 0, bottom: 0 }} allowDecimals={false} />
            </>
          )}

          <Tooltip />
          <Bar
            dataKey="count"
            fill="#1976d2"
            barSize={BAR_HEIGHT}
            radius={[0, 4, 4, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  /* ======================================================
     STACKED (Row-wise Percentages)
     ====================================================== */
  if (type === 'stacked') {
    const rows = [];

    Object.entries(data || {}).forEach(([problem, items]) => {
      const r = { problem };
      items.forEach(i => {
        r[i.solution] = i.percentage;
      });
      rows.push(r);
    });

    if (!rows.length) {
      return <Typography variant="body2">No data</Typography>;
    }

    const keys = Object.keys(rows[0]).filter(k => k !== 'problem');

    return (
      <ResponsiveContainer width="100%" height={calcHeight(rows.length)}>
        <BarChart
          data={rows}
          layout="vertical"
          margin={{ top: 10, right: 30, left: calcLeftMargin(rows), bottom: 10 }}
          barCategoryGap={BAR_GAP}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            type="number"
            domain={[0, 100]}
            tickFormatter={v => `${v}%`}
          />
          <YAxis
            type="category"
            dataKey="problem"
  padding={{ top: 0, bottom: 0 }}
            tick={{ fontSize: 11 }}
            tickFormatter={wrapLabel}
          />
          <Tooltip formatter={v => `${v}%`} />
          {keys.map((k, i) => (
            <Bar
              key={k}
              dataKey={k}
              stackId="a"
              fill={COLORS[i % COLORS.length]}
              barSize={BAR_HEIGHT}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    );
  }

  /* ======================================================
     SCATTER (Underexplored Gaps)
     ====================================================== */
  if (type === 'scatter') {
    return (
      <ResponsiveContainer width="100%" height={calcHeight(data.length)}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{
            top: 10,
            right: 30,
            left: calcLeftMargin(data),
            bottom: 10,
          }}
          barCategoryGap={BAR_GAP}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
  type="number"
  domain={[0, 'dataMax']}
  allowDecimals={false}
/>

          <YAxis
            type="category"
            dataKey="problem"
  padding={{ top: 0, bottom: 0 }}
            tick={{ fontSize: 11 }}
            tickFormatter={wrapLabel}
          />
          <Tooltip />
          <Bar
            dataKey="count"
            fill="#ed6c02"
            barSize={BAR_HEIGHT}
            radius={[0, 4, 4, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return null;
}
