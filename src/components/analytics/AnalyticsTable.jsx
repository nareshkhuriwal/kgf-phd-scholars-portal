import React from 'react';
import {
  Table, TableBody, TableCell, TableHead,
  TableRow, TableContainer, Typography, Paper
} from '@mui/material';

export default function AnalyticsTable({ type, data }) {
  if (!data || (Array.isArray(data) && !data.length)) {
    return <Typography variant="body2">No data</Typography>;
  }

  const Container = ({ children }) => (
    <TableContainer
      component={Paper}
      sx={{
        maxHeight: 240,
        overflowY: 'auto',
        overflowX: 'auto'
      }}
    >
      {children}
    </TableContainer>
  );

  /* ================= MATRIX ================= */
  if (type === 'matrix') {
    if (!data?.solutions || !data?.matrix) {
      return <Typography>No matrix data</Typography>;
    }

    const { solutions, matrix } = data;

    return (
      <Container>
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
                <TableCell sx={{ minWidth: 220 }}>
                  {row.problem}
                </TableCell>
                {solutions.map(s => (
                  <TableCell key={s}>{row[s] ?? 0}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Container>
    );
  }

  /* ================= BAR ================= */
  if (type === 'bar') {
    const key = data[0]?.problem ? 'problem' : 'solution';

    return (
      <Container>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>
                {key === 'problem' ? 'Problem' : 'Solution'}
              </TableCell>
              <TableCell align="right">Count</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((r, i) => (
              <TableRow key={i}>
                <TableCell sx={{ minWidth: 220 }}>
                  {r[key]}
                </TableCell>
                <TableCell align="right">{r.count}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Container>
    );
  }

  /* ================= STACKED ================= */
  if (type === 'stacked') {
    return (
      <Container>
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
                  <TableCell sx={{ minWidth: 220 }}>
                    {problem}
                  </TableCell>
                  <TableCell>{r.solution}</TableCell>
                  <TableCell align="right">
                    {r.percentage}%
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Container>
    );
  }

  /* ================= SCATTER ================= */
  if (type === 'scatter') {
    return (
      <Container>
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
                <TableCell sx={{ minWidth: 220 }}>
                  {r.problem}
                </TableCell>
                <TableCell>{r.solution}</TableCell>
                <TableCell align="right">{r.count}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Container>
    );
  }

  return null;
}
