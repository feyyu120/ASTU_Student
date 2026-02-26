// src/pages/admin-login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  InputAdornment, 
  IconButton, 
  CircularProgress, 
  Alert, 
  Paper, 
  Container 
} from '@mui/material';
import { Visibility, VisibilityOff, Email, Lock } from '@mui/icons-material';
import axios from 'axios';
import { TypeAnimation } from 'react-type-animation';

const API_BASE = 'http://localhost:5000'; // Change to your backend URL

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!email.trim() || !password.trim()) {
      setError('Email and password are required');
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await axios.post(`${API_BASE}/api/auth/login`, { 
        email: email.trim(), 
        password 
      });

      const { token, user } = res.data;

      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(user));

      // Role check
      if (user.role !== 'admin') {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        throw new Error('Access denied. Admin login only.');
      }

      setSuccess('Login successful! Redirecting to dashboard...');
      console.log(token,user.role)
      setTimeout(() => navigate('/admin', { replace: true }), 1500);
    } catch (err) {
      const errMsg = err.response?.data?.message 
        || err.message 
        || 'Login failed. Please check your credentials.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        py: { xs: 4, md: 8 }
      }}>
        <Paper 
          elevation={10} 
          sx={{ 
            p: { xs: 4, md: 6 }, 
            borderRadius: 4, 
            width: '100%',
            maxWidth: 480,
            background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
            border: '1px solid #e0e0e0'
          }}
        >
          {/* Logo & Welcome */}
          <Box sx={{ textAlign: 'center', mb: 5 }}>
          
            <TypeAnimation
              sequence={[
                'Admin Login',
                1000,
                'Secure Admin Portal',
                1000,
              ]}
              wrapper="h1"
              speed={50}
              repeat={Infinity}
              style={{ 
                fontSize: '2.5rem', 
                fontWeight: 700, 
                color: '#16bd93',
                marginBottom: 8,
                display: 'inline-block'
              }}
            />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Restricted access — admins only
            </Typography>
          </Box>

          {/* Alerts */}
          {error && (
            <Alert severity="error" sx={{ mb: 4 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 4 }}>
              {success}
            </Alert>
          )}

          {/* Form */}
          <form onSubmit={handleLogin}>
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value.trim())}
              margin="normal"
              variant="outlined"
              required
              autoFocus
              autoComplete="email"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email color="action" />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 3 }}
            />

            <TextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              variant="outlined"
              required
              autoComplete="current-password"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 4 }}
            />

            <Button
              fullWidth
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              sx={{
                py: 1.8,
                backgroundColor: '#16bd93',
                '&:hover': { backgroundColor: '#0f9d7a' },
                fontWeight: 'bold',
                borderRadius: 2,
                textTransform: 'none',
                fontSize: '1.1rem',
                boxShadow: '0 4px 12px rgba(22,189,147,0.3)'
              }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Login to Admin Panel'
              )}
            </Button>
          </form>

          {/* Footer */}
          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              This is a restricted admin area. Unauthorized access is prohibited.
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}