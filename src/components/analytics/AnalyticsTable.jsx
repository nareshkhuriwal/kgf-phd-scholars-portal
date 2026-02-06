import React from 'react';
import {
  Table, TableBody, TableCell, TableHead, TableRow, Typography
} from '@mui/material';

export default function AnalyticsTable({ type, data }) {
  if (!data || (Array.isArray(data) && !data.length)) {
    return <Typography variant="body2">No data</Typography>;
  }

  /* ---------------- MATRIX ---------------- */
  if (type === 'matrix') {
  if (!data || !data.solutions || !data.matrix) {
    return <Typography variant="body2">No matrix data</Typography>;
  }

  const { solutions, matrix } = data;

  return (
    <Table size="small" stickyHeader>
      <TableHead>
        <TableRow>
          <TableCell>Problem</TableCell>
          {solutions.map(s => (
            <TableCell key={s}>{s}</TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {matrix.map(row => (
          <TableRow key={row.problem}>
            <TableCell>{row.problem}</TableCell>
            {solutions.map(s => (
              <TableCell key={s}>{row[s] ?? 0}</TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}


  /* ---------------- BAR ---------------- */
  if (type === 'bar') {
    const key = data[0]?.problem ? 'problem' : 'solution';

    return (
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell>{key === 'problem' ? 'Problem' : 'Solution'}</TableCell>
            <TableCell align="right">Count</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((r, i) => (
            <TableRow key={i}>
              <TableCell>{r[key]}</TableCell>
              <TableCell align="right">{r.count}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  /* ---------------- STACKED ---------------- */
  if (type === 'stacked') {
    return (
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell>Problem</TableCell>
            <TableCell>Solution</TableCell>
            <TableCell align="right">%</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {Object.entries(data).flatMap(([problem, rows]) =>
            rows.map((r, i) => (
              <TableRow key={`${problem}-${i}`}>
                <TableCell>{problem}</TableCell>
                <TableCell>{r.solution}</TableCell>
                <TableCell align="right">{r.percentage}%</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    );
  }

  /* ---------------- SCATTER / GAPS ---------------- */
  if (type === 'scatter') {
    return (
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell>Problem</TableCell>
            <TableCell>Solution</TableCell>
            <TableCell align="right">Count</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((r, i) => (
            <TableRow key={i}>
              <TableCell>{r.problem}</TableCell>
              <TableCell>{r.solution}</TableCell>
              <TableCell align="right">{r.count}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  return null;
}
