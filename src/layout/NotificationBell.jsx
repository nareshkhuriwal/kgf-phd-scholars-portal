// src/components/layout/NotificationBell.jsx
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  loadInviteNotifications,
  respondToInvite,
  markInviteNotificationRead,
  markAllInviteNotificationsRead,
  selectInviteNotifications,
  selectUnreadInviteCount,
} from '../store/inviteNotificationsSlice';

import {
  IconButton,
  Badge,
  Popover,
  Box,
  Typography,
  Button,
  Stack,
  CircularProgress,
  Divider,
} from '@mui/material';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';

export default function NotificationBell() {
  const dispatch = useDispatch();
  const { items, loading } = useSelector(selectInviteNotifications);
  const unreadCount = useSelector(selectUnreadInviteCount);

  const [anchorEl, setAnchorEl] = React.useState(null);

  const open = Boolean(anchorEl);

  const handleOpen = (event) => {
    setAnchorEl(event.currentTarget);
    // lazy-load notifications when first opened
    if (!items.length) {
      dispatch(loadInviteNotifications());
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleRespond = (id, action) => {
    dispatch(respondToInvite({ id, action }));
  };

  const handleMarkRead = (id) => {
    dispatch(markInviteNotificationRead(id));
  };

  const handleMarkAllRead = () => {
    if (items.length) {
      dispatch(markAllInviteNotificationsRead());
    }
  };

  return (
    <>
      <IconButton color="inherit" onClick={handleOpen}>
        <Badge
          badgeContent={unreadCount}
          color="error"
          invisible={unreadCount === 0}
        >
          <NotificationsNoneIcon />
        </Badge>
      </IconButton>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{ sx: { width: 360, maxHeight: 420 } }}
      >
        <Box p={2} pb={1} display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="subtitle1"> Notification</Typography>
          {items.length > 0 && (
            <Button size="small" onClick={handleMarkAllRead}>
              Mark all as read
            </Button>
          )}
        </Box>

        <Divider />

        <Box sx={{ maxHeight: 360, overflowY: 'auto' }}>
          {loading && (
            <Box p={2} display="flex" justifyContent="center">
              <CircularProgress size={20} />
            </Box>
          )}

          {!loading && items.length === 0 && (
            <Box p={2}>
              <Typography variant="body2" color="text.secondary">
                You're all caught up
              </Typography>
            </Box>
          )}

          {!loading &&
            items.map((n) => {
              const isPending = n.status === 'pending';
              const isAccepted = n.status === 'accepted';
              const isDeclined = n.status === 'declined';

              return (
                <Box key={n.id} px={2} py={1.5}>
                  <Stack spacing={0.5}>
                    <Typography
                      variant="body2"
                      fontWeight={n.is_read ? 400 : 600}
                    >
                      {/* Customize message as needed */}
                      {n.message ||
                        `Invitation from ${n.inviter_name || 'Researcher'}`}
                    </Typography>

                    {n.created_at && (
                      <Typography variant="caption" color="text.secondary">
                        {new Date(n.created_at).toLocaleString()}
                      </Typography>
                    )}

                    <Stack direction="row" spacing={1} mt={0.5}>
                      {isPending && (
                        <>
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => handleRespond(n.id, 'accept')}
                          >
                            Accept
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            onClick={() => handleRespond(n.id, 'decline')}
                          >
                            Decline
                          </Button>
                        </>
                      )}

                      {!isPending && (
                        <Typography
                          variant="caption"
                          sx={{
                            px: 1,
                            py: 0.3,
                            borderRadius: 1,
                            bgcolor: isAccepted
                              ? 'success.light'
                              : isDeclined
                              ? 'error.light'
                              : 'grey.200',
                          }}
                        >
                          {isAccepted ? 'Accepted' : isDeclined ? 'Declined' : n.status}
                        </Typography>
                      )}

                      <Box flexGrow={1} />

                      <Button
                        size="small"
                        variant="text"
                        onClick={() => handleMarkRead(n.id)}
                        disabled={n.is_read}
                      >
                        {n.is_read ? 'Read' : 'Mark as read'}
                      </Button>
                    </Stack>
                  </Stack>

                  <Divider sx={{ mt: 1.5 }} />
                </Box>
              );
            })}
        </Box>
      </Popover>
    </>
  );
}
