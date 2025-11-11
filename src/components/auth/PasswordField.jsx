import React from 'react';
import { TextField, IconButton, InputAdornment } from '@mui/material';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import Visibility from '@mui/icons-material/Visibility';

export default function PasswordField({ label = 'Password', error, helperText, ...rest }) {
  const [show, setShow] = React.useState(false);
  return (
    <TextField
      type={show ? 'text' : 'password'}
      label={label}
      fullWidth
      error={!!error}
      helperText={helperText}
      InputProps={{
        endAdornment: (
          <InputAdornment position="end">
            <IconButton onClick={() => setShow(s => !s)} edge="end" aria-label="toggle password">
              {show ? <VisibilityOff /> : <Visibility />}
            </IconButton>
          </InputAdornment>
        )
      }}
      {...rest}
    />
  );
}
