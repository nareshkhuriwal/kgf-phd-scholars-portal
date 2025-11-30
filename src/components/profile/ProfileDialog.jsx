import * as React from 'react';
import {
  Dialog, DialogContent, DialogActions,
  TextField, Button, Stack, Alert, Tooltip, Typography,
  Box, IconButton, Divider, CircularProgress, Avatar, Badge, Grid, Chip, Autocomplete
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useDispatch, useSelector } from 'react-redux';

// Import actions for both Profile AND Auth
import { fetchMe, updateProfile, uploadAvatar } from '../../store/profileSlice';
import { setUser } from '../../store/authSlice';

// Icons
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import BusinessIcon from '@mui/icons-material/Business';
import LockIcon from '@mui/icons-material/Lock';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import SaveIcon from '@mui/icons-material/Save';
import InfoIcon from '@mui/icons-material/Info';

// --- Styled Components ---
const THEME_GRADIENT = 'linear-gradient(135deg, #191792ff 0%, #151856cb 100%)';
const THEME_SHADOW = '0 8px 32px rgba(118, 75, 162, 0.25)';

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiBackdrop-root': {
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    backdropFilter: 'blur(8px)',
  },
  '& .MuiPaper-root': {
    borderRadius: 24,
    boxShadow: THEME_SHADOW,
    overflow: 'hidden',
  }
}));

const HeaderBackground = styled(Box)(({ theme }) => ({
  background: THEME_GRADIENT,
  padding: theme.spacing(3, 3, 6, 3),
  color: 'white',
  position: 'relative',
}));

const AvatarWrapper = styled(Box)(({ theme }) => ({
  position: 'relative',
  marginTop: -45,
  marginLeft: 24,
  marginBottom: 10,
  width: 90,
  height: 90,
  '& .MuiAvatar-root': {
    width: 90,
    height: 90,
    border: '4px solid white',
    boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
    fontSize: 32,
    background: 'white',
    color: '#764ba2',
    fontWeight: 700,
  }
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    transition: 'all 0.2s ease-in-out',
    '&:hover': {
      backgroundColor: '#fff',
      boxShadow: '0 0 0 4px rgba(102,126,234,0.05)',
    },
    '&.Mui-focused': {
      backgroundColor: '#fff',
      boxShadow: '0 0 0 4px rgba(102,126,234,0.15)',
      '& fieldset': { borderColor: '(135deg, #1916cbff 0%, #1b24d0cb 100%)', borderWidth: 2 }
    }
  },
}));

const SuggestionBox = styled(Box)(({ theme }) => ({
  backgroundColor: '#f0f4ff',
  border: '1px solid #e0e7ff',
  borderRadius: 10,
  padding: theme.spacing(2),
  marginTop: theme.spacing(1),
  display: 'flex',
  alignItems: 'flex-start',
  gap: theme.spacing(1.5),
}));

// Generate smart suggestions based on input
const generateSuggestions = (originalName, currentName) => {
  const suggestions = [];
  
  if (currentName && currentName !== originalName) {
    // Show current changed name first
    suggestions.push({
      label: `${currentName} (current)`,
      value: currentName,
      type: 'current'
    });
  }
  
  // Show original name if it exists and is different
  if (originalName && originalName !== currentName) {
    suggestions.push({
      label: `${originalName} (original)`,
      value: originalName,
      type: 'original'
    });
  }
  
  return suggestions;
};

// Common organization suggestions
const ORGANIZATION_SUGGESTIONS = [
  "Education Institute",
  'Tech Solutions Inc.',
  'Digital Innovations',
  'Cloud Services Ltd.',
  'Data Analytics Corp.',
  'Consulting Group',
  'Software Development Co.',
  'Enterprise Solutions',
  'Business Services',
  'Independent',
  'Startup',
  'Freelancer',
];

// Phone format suggestion
const generatePhoneSuggestion = (phone) => {
  const cleaned = (phone || '').replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `+1 (${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  if (cleaned.length === 11 && cleaned[0] === '1') {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  return phone;
};

const FIELDS = [
  { key: 'name', label: 'Full Name', Icon: PersonIcon, placeholder: 'John Doe', cols: 12 },
  { key: 'phone', label: 'Phone Number', Icon: PhoneIcon, placeholder: '+1 (555) 000-0000', cols: 6 },
  { key: 'organization', label: 'Organization', Icon: BusinessIcon, placeholder: 'Organization', cols: 6 }
];

export default function ProfileDialog({ open, onClose }) {
  const dispatch = useDispatch();
  
  const { user: authUser } = useSelector(s => s.auth);
  const { me, loading, error } = useSelector(s => s.profile);
  
  const [form, setForm] = React.useState({ name: '', email: '', phone: '', organization: '' });
  const [suggestions, setSuggestions] = React.useState({
    phone: null,
  });
  
  const fileInputRef = React.useRef(null);
  const originalFormRef = React.useRef({});

  React.useEffect(() => { 
    if (open) {
      dispatch(fetchMe());
    }
  }, [open, dispatch]);
  
  React.useEffect(() => {
    if (me && open) {
      const initialForm = { 
        name: me.name || '', 
        email: me.email || '', 
        phone: me.phone || '', 
        organization: me.organization || '' 
      };
      setForm(initialForm);
      originalFormRef.current = initialForm;
    }
  }, [me, open]);

  const handleChange = (key) => (e) => {
    const value = e.target.value;
    const updatedForm = { ...form, [key]: value };
    setForm(updatedForm);

    // Generate suggestions based on field type
    if (key === 'phone') {
      const formatted = generatePhoneSuggestion(value);
      setSuggestions(prev => ({
        ...prev,
        phone: formatted !== value ? formatted : null
      }));
    }
  };

  const applySuggestion = (field, value) => {
    setForm({ ...form, [field]: value });
    if (field === 'name') {
      setSuggestions(prev => ({ ...prev, name: [] }));
    }
  };

  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  // Avatar source: prefer profile.me avatar, otherwise auth user avatar
  const avatarSrc = me?.avatar || authUser?.avatar || null;

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      // uploadAvatar thunk should return backend response (possibly { user: {...} })
      const res = await dispatch(uploadAvatar(formData)).unwrap();
      // normalize response (support { user: {...} } or direct user object)
      const updatedUser = res?.user ?? res ?? null;

      if (authUser && updatedUser) {
        // update auth slice with returned user fields (avatar included)
        dispatch(setUser({ ...authUser, ...updatedUser }));
      }

      // Refresh profile.me so UI uses latest data (ensures avatar shows immediately)
      dispatch(fetchMe());
    } catch (err) {
      console.error("Avatar upload failed:", err);
    }
  };

  const handleSubmit = async () => {
    try {
      const updatedProfile = await dispatch(updateProfile(form)).unwrap();
      if (authUser && updatedProfile) {
        dispatch(setUser({ ...authUser, ...updatedProfile }));
      } else {
        dispatch(setUser({ ...authUser, ...form }));
      }
      onClose();
    } catch (err) {
      console.error("Failed to update profile:", err);
    }
  };

  const getInitials = () => {
    const name = form.name || me?.name || authUser?.name || '';
    if (!name) return <PersonIcon />;
    return name.charAt(0).toUpperCase();
  };

  return (
    <StyledDialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      scroll="paper"
    >
      <input
        type="file"
        ref={fileInputRef}
        hidden
        accept="image/png, image/jpeg, image/jpg, image/webp"
        onChange={handleFileChange}
      />

      <HeaderBackground>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Typography variant="h6" fontWeight="700" sx={{ opacity: 0.9, letterSpacing: 0.5 }}>
            Edit Profile
          </Typography>
          <IconButton 
            onClick={onClose} 
            size="small" 
            sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.1)' }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </HeaderBackground>

      <Box sx={{ px: 3, pb: 2 }}>
        <Box display="flex" alignItems="flex-end" justifyContent="space-between">
          <AvatarWrapper>
            <Badge
              overlap="circular"
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              badgeContent={
                <Box 
                  onClick={handleCameraClick}
                  sx={{ 
                    bgcolor: '#f0f0f0', 
                    borderRadius: '50%', 
                    p: 0.5, 
                    border: '2px solid white', 
                    cursor: 'pointer',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                    transition: 'transform 0.2s',
                    '&:hover': { transform: 'scale(1.1)', bgcolor: '#e2e8f0' }
                  }}
                >
                  <CameraAltIcon sx={{ fontSize: 16, color: '#555' }} />
                </Box>
              }
            >
              <Avatar src={avatarSrc} alt={form.name || 'User avatar'}>
                {getInitials()}
              </Avatar>
            </Badge>
          </AvatarWrapper>
          
          <Tooltip title="Email is locked">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: 'rgba(255, 152, 0, 0.08)', color: 'warning.dark', px: 1.5, py: 0.75, borderRadius: 2, mb: 1 }}>
              <LockIcon sx={{ fontSize: 14 }} />
              <Typography variant="caption" fontWeight="600">{form.email}</Typography>
            </Box>
          </Tooltip>
        </Box>

        <DialogContent sx={{ p: 0, mt: 2 }}>
          <Stack spacing={2.5}>
            {error && <Alert severity="error" variant="filled" sx={{ borderRadius: 2 }}>{String(error)}</Alert>}
            <Grid container spacing={2}>
              {FIELDS.map(({ key, label, Icon, placeholder, cols }) => (
                <Grid item xs={12} sm={cols} key={key}>
                  {key === 'organization' ? (
                    <Autocomplete
                      freeSolo
                      options={ORGANIZATION_SUGGESTIONS}
                      value={form[key]}
                      onChange={(e, value) => setForm({ ...form, organization: value || '' })}
                      onInputChange={(e, value) => setForm({ ...form, organization: value })}
                      disabled={loading}
                      renderInput={(params) => (
                        <StyledTextField
                          {...params}
                          label={label}
                          placeholder={placeholder}
                          fullWidth
                          disabled={loading}
                          InputProps={{ 
                            ...params.InputProps,
                            startAdornment: <Icon sx={{ mr: 1.5, color: '#94a3b8', fontSize: 20 }} />
                          }}
                        />
                      )}
                    />
                  ) : (
                    <StyledTextField
                      label={label}
                      value={form[key]}
                      onChange={handleChange(key)}
                      fullWidth
                      disabled={loading}
                      placeholder={placeholder}
                      InputProps={{ startAdornment: <Icon sx={{ mr: 1.5, color: '#94a3b8', fontSize: 20 }} /> }}
                    />
                  )}


                  {key === 'phone' && suggestions.phone && (
                    <SuggestionBox>
                      <InfoIcon sx={{ fontSize: 18, color: '#4f46e5', flexShrink: 0, mt: 0.5 }} />
                      <Box flex={1}>
                        <Typography variant="caption" sx={{ fontWeight: 600, color: '#4f46e5', display: 'block', mb: 1 }}>
                          Format suggestion:
                        </Typography>
                        <Chip
                          label={suggestions.phone}
                          onClick={() => applySuggestion('phone', suggestions.phone)}
                          color="primary"
                          size="small"
                          sx={{
                            cursor: 'pointer',
                            fontWeight: 500,
                            '&:hover': { backgroundColor: '#4f46e5', color: 'white' }
                          }}
                        />
                      </Box>
                    </SuggestionBox>
                  )}
                </Grid>
              ))}
            </Grid>
            <Divider sx={{ my: 1, borderColor: '#f1f5f9' }} />
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 0, mt: 4, gap: 1.5 }}>
          <Button onClick={onClose} disabled={loading} sx={{ color: 'text.secondary', fontWeight: 600 }}>Cancel</Button>
          
          <Button 
            variant="contained" 
            onClick={handleSubmit} 
            disabled={loading}
            startIcon={!loading && <SaveIcon />}
            sx={{
              borderRadius: 3, px: 4, py: 1, textTransform: 'none', fontWeight: 600,
              background: THEME_GRADIENT,
              boxShadow: '0 4px 14px rgba(102,126,234,0.4)',
            }}
          >
            {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Save Changes'}
          </Button>
        </DialogActions>
      </Box>
    </StyledDialog>
  );
}
