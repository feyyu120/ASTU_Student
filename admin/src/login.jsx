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

const API_BASE = 'http://localhost:5000'; // ← CHANGE TO YOUR BACKEND URL (or production URL)

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
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await axios.post(`${API_BASE}/api/auth/login`, { email, password });
      const { token, user } = res.data;

      // Save to localStorage (web standard)
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(user));

      // Check role
      if (user.role !== 'admin') {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        throw new Error('Access denied. Admin login only.');
      }

      setSuccess('Login successful! Redirecting to admin dashboard...');
      setTimeout(() => navigate('/admin'), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check your email and password.');
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
        py: 4
      }}>
        <Paper 
          elevation={10} 
          sx={{ 
            p: { xs: 4, md: 6 }, 
            borderRadius: 4, 
            width: '100%',
            maxWidth: 480,
            background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)'
          }}
        >
          {/* Logo & Welcome */}
          <Box sx={{ textAlign: 'center', mb: 5 }}>
            <img 
              src="/assets/images/delivery.png" // ← update with your actual logo path
              alt="ASTU Logo"
              style={{ 
                width: 140, 
                height: 140, 
                marginBottom: 24, 
                objectFit: 'contain' 
              }}
            />
            <TypeAnimation
              sequence={['Admin Login', 800, 'Secure Access Only', 800]}
              wrapper="h1"
              speed={50}
              repeat={0}
              style={{ 
                fontSize: '2.5rem', 
                fontWeight: 700, 
                color: '#16bd93',
                marginBottom: 8,
                display: 'inline-block'
              }}
            />
            <Typography variant="body2" color="text.secondary">
              Please sign in to access the admin panel
            </Typography>
          </Box>

          {/* Messages */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {success}
            </Alert>
          )}

          {/* Form */}
          <form onSubmit={handleLogin}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value.trim())}
              margin="normal"
              variant="outlined"
              required
              autoFocus
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
                fontSize: '1.1rem'
              }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Login to Admin Panel'
              )}
            </Button>
          </form>

          {/* Footer note */}
          <Typography 
            variant="body2" 
            align="center" 
            color="text.secondary" 
            sx={{ mt: 4, fontSize: '0.9rem' }}
          >
            This is a restricted area. Unauthorized access is prohibited.
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
}