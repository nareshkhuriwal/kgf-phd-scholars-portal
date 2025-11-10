// src/layout/Sidebar.jsx
import React from 'react';
import { useLocation, NavLink } from 'react-router-dom';
import {
  Drawer,
  Toolbar,
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  Tooltip
} from '@mui/material';
import { SECTIONS } from './constants/navSections';

const drawerWidth = 240;
const collapsedWidth = 68;

export default function Sidebar({ open }) {
  const location = useLocation();

  const activeSection =
    SECTIONS.find((s) => location.pathname.startsWith(s.base)) || SECTIONS[0];

  return (
    <Drawer
      variant="permanent"
      open={open}
      sx={{
        width: open ? drawerWidth : collapsedWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: open ? drawerWidth : collapsedWidth,
          boxSizing: 'border-box',
          borderRight: '1px solid #eee',
          overflowX: 'hidden',
          transition: (theme) =>
            theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen
            })
        }
      }}
    >
      <Toolbar />
      <Box sx={{ overflowY: 'auto', overflowX: 'hidden' }}>
        {/* Section label hidden when collapsed */}
        <Typography
          variant="caption"
          sx={{
            px: 2,
            pt: 1,
            pb: 0.5,
            color: 'text.secondary',
            display: open ? 'block' : 'none'
          }}
        >
          {activeSection.label}
        </Typography>

        <List component="nav" dense>
          {(activeSection.items || []).map((item) => {
            const Icon = item.Icon;
            const selected = location.pathname === item.to;

            const button = (
              <ListItemButton
                key={item.to}
                component={NavLink}
                to={item.to}
                selected={selected}
                sx={{
                  // center icon when collapsed
                  justifyContent: open ? 'flex-start' : 'center',
                  px: open ? 2 : 1,
                  minHeight: 44,
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: open ? 1.5 : 0,
                    justifyContent: 'center',
                  }}
                >
                  <Icon />
                </ListItemIcon>

                {/* Hide text when collapsed */}
                <ListItemText
                  primary={item.label}
                  sx={{
                    opacity: open ? 1 : 0,
                    display: open ? 'block' : 'none',
                    whiteSpace: 'nowrap'
                  }}
                />
              </ListItemButton>
            );

            // When collapsed, wrap each item in a Tooltip for discoverability
            return open ? (
              button
            ) : (
              <Tooltip key={item.to} title={item.label} placement="right">
                <Box>{button}</Box>
              </Tooltip>
            );
          })}
        </List>

        <Divider />
      </Box>
    </Drawer>
  );
}
