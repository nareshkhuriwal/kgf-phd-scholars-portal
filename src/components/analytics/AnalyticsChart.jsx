import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  LabelList,
} from 'recharts';
import { Typography } from '@mui/material';

/* ================= CONSTANTS ================= */
const COLORS = ['#1976d2', '#9c27b0', '#ed6c02', '#2e7d32'];
const BAR_HEIGHT = 22;
const BAR_GAP = 14;

// ✅ Fixed margin for ALL charts
const FIXED_LEFT_MARGIN = 20;

/* ================= HELPERS ================= */

// Wrap long axis labels
const wrapLabel = (text, max = 26) => {
  if (!text) return '';
  const words = String(text).split(' ');
  const lines = [];
  let line = '';

  words.forEach(w => {
    if ((line + ' ' + w).trim().length > max) {
      if (line) lines.push(line);
      line = w;
    } else {
      line = line ? `${line} ${w}` : w;
    }
  });

  if (line) lines.push(line);
  return lines.join('\n');
};

// Chart height based on number of rows
const calcHeight = (rows = 1) => Math.max(rows * (BAR_HEIGHT + BAR_GAP), 220);

/* ================= SORT HELPERS (DESC) ================= */

const sortRowsDesc = (rows, key) =>
  [...(rows || [])].sort(
    (a, b) => Number(b?.[key] ?? 0) - Number(a?.[key] ?? 0)
  );

const sumRow = (r) =>
  Object.entries(r || {})
    .filter(([k]) => k !== 'problem')
    .reduce((s, [, v]) => s + Number(v || 0), 0);

const sortMatrixRowsDescByTotal = (rows) =>
  [...(rows || [])].sort((a, b) => sumRow(b) - sumRow(a));

const totalPct = (r) =>
  Object.entries(r || {})
    .filter(([k]) => k !== 'problem')
    .reduce((s, [, v]) => s + Number(v || 0), 0);

const sortStackedRowsDescByTotal = (rows) =>
  [...(rows || [])].sort((a, b) => totalPct(b) - totalPct(a));

/* ================= LABEL HELPERS ================= */

// Labels should be placed differently depending on layout
const labelPositionForLayout = (layout) =>
  layout === 'vertical' ? 'right' : 'top';

// show only meaningful labels (avoid clutter on 0)
const renderNumberLabel = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n) || n === 0) return '';
  return String(Math.round(n * 100) / 100);
};

const renderPercentLabel = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n) || n === 0) return '';
  return `${Math.round(n)}%`;
};

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

    const sortedRows = sortMatrixRowsDescByTotal(rows);

    return (
      <ResponsiveContainer width="100%" height={calcHeight(sortedRows.length)}>
        <BarChart
          data={sortedRows}
          layout="vertical"
          margin={{ top: 8, right: 20, left: FIXED_LEFT_MARGIN, bottom: 8 }}
          barCategoryGap={BAR_GAP}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" domain={[0, 'dataMax']} allowDecimals={false} />
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
            >
              {/* ✅ value label on each stacked segment */}
              <LabelList
                dataKey={s}
                position="center"
                formatter={renderNumberLabel}
                style={{ fontSize: 10 }}
              />
            </Bar>
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

    if (data?.matrix) {
      rows = data.matrix.map(r => ({
        problem: r.problem,
        count: Object.entries(r)
          .filter(([k]) => k !== 'problem')
          .reduce((s, [, v]) => s + Number(v || 0), 0),
      }));
    } else if (Array.isArray(data)) {
      rows = data;
    }

    if (!rows.length) return <Typography variant="body2">No data</Typography>;

    rows = sortRowsDesc(rows, 'count');

    const isProblem = Boolean(rows[0]?.problem);
    const isSolution = Boolean(rows[0]?.solution);
    const layout = isProblem ? 'vertical' : 'horizontal';

    return (
      <ResponsiveContainer width="100%" height={calcHeight(rows.length)}>
        <BarChart
          data={rows}
          layout={layout}
          margin={{ top: 10, right: 20, left: FIXED_LEFT_MARGIN, bottom: 30 }}
          barCategoryGap={BAR_GAP}
        >
          <CartesianGrid strokeDasharray="3 3" />

          {isProblem ? (
            <>
              <XAxis type="number" domain={[0, 'dataMax']} allowDecimals={false} />
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
                dataKey={isSolution ? 'solution' : 'label'}
                interval={0}
                angle={-10}
                textAnchor="end"
                height={30}
                tickMargin={15}
                tickFormatter={(v) =>
                  String(v).length > 18 ? String(v).slice(0, 18) + '…' : v
                }
              />
              <YAxis type="number" padding={{ top: 0, bottom: 0 }} allowDecimals={false} />
            </>
          )}

          <Tooltip />
          <Bar
            dataKey="count"
            fill="#1976d2"
            barSize={BAR_HEIGHT}
            radius={[0, 4, 4, 0]}
          >
            {/* ✅ count label on each bar */}
            <LabelList
              dataKey="count"
              position={labelPositionForLayout(layout)}
              formatter={renderNumberLabel}
              style={{ fontSize: 11 }}
            />
          </Bar>
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
      (items || []).forEach(i => {
        r[i.solution] = i.percentage;
      });
      rows.push(r);
    });

    if (!rows.length) return <Typography variant="body2">No data</Typography>;

    const sortedRows = sortStackedRowsDescByTotal(rows);
    const keys = Object.keys(sortedRows[0]).filter(k => k !== 'problem');

    return (
      <ResponsiveContainer width="100%" height={calcHeight(sortedRows.length)}>
        <BarChart
          data={sortedRows}
          layout="vertical"
          margin={{ top: 10, right: 30, left: FIXED_LEFT_MARGIN, bottom: 10 }}
          barCategoryGap={BAR_GAP}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" domain={[0, 100]} tickFormatter={v => `${v}%`} />
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
            >
              {/* ✅ percent label on each stacked segment */}
              <LabelList
                dataKey={k}
                position="center"
                formatter={renderPercentLabel}
                style={{ fontSize: 10 }}
              />
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
    );
  }

  /* ======================================================
     SCATTER (Underexplored Gaps) (bar-based)
     ====================================================== */
  if (type === 'scatter') {
    const rows = sortRowsDesc(Array.isArray(data) ? data : [], 'count');

    return (
      <ResponsiveContainer width="100%" height={calcHeight(rows.length)}>
        <BarChart
          data={rows}
          layout="vertical"
          margin={{ top: 10, right: 30, left: FIXED_LEFT_MARGIN, bottom: 10 }}
          barCategoryGap={BAR_GAP}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" domain={[0, 'dataMax']} allowDecimals={false} />
          <YAxis
            type="category"
            dataKey="problem"
            padding={{ top: 0, bottom: 0 }}
            tick={{ fontSize: 11 }}
            tickFormatter={wrapLabel}
          />
          <Tooltip />
          <Bar dataKey="count" fill="#ed6c02" barSize={BAR_HEIGHT} radius={[0, 4, 4, 0]}>
            {/* ✅ count label on each bar */}
            <LabelList
              dataKey="count"
              position="right"
              formatter={renderNumberLabel}
              style={{ fontSize: 11 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return null;
}
