
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  Button, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  CircularProgress, 
  Alert, 
  Box, 
  IconButton,
  Tooltip,
  Chip,
} from '@mui/material';
import { 
  Refresh as RefreshIcon,
  CheckCircle as ApproveIcon, 
  Cancel as RejectIcon,
  People as UsersIcon,
  Inventory as ItemsIcon,
  PendingActions as PendingIcon,
  DoneAll as ResolvedIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import axios from 'axios';

const API_BASE = 'http://localhost:5000'; 

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalItems: 0,
    pendingClaims: 0,
    resolvedItems: 0,
  });
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const user = JSON.parse(localStorage.getItem('user'));


    if (!user || user.role !== 'admin') {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      navigate('/login', { replace: true });
      return;
    }

  
    fetchAdminData(token);
  }, [navigate]); 

  const fetchAdminData = async (token) => {
    setLoading(true);
    setError(null);

    try {
   
      const statsRes = await axios.get(`${API_BASE}/api/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(statsRes.data);

      const claimsRes = await axios.get(`${API_BASE}/api/claims/pending`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClaims(claimsRes.data);
    } catch (err) {
      console.error('Admin data fetch error:', err);
      const msg = err.response?.data?.message || 'Failed to load admin data';
      setError(msg);

      
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        navigate('/login', { replace: true });
      }
    } finally {
      setLoading(false);
    }
  };

 const handleClaimAction = async (claimId, action) => {
  const status = action === 'approve' ? 'approved' : 'rejected';  // ← Add "ed"
  const actionText = action === 'approve' ? 'Approve' : 'Reject';

  if (!window.confirm(`Are you sure you want to ${actionText.toLowerCase()} this claim?`)) return;

  const token = localStorage.getItem('authToken');

  try {
    await axios.put(
      `${API_BASE}/api/claims/${claimId}`,
      { status },  
      { headers: { Authorization: `Bearer ${token}` } }
    );

    setSuccessMsg(`Claim ${actionText.toLowerCase()}d successfully`);
    fetchAdminData(token);
  } catch (err) {
    const msg = err.response?.data?.message || `Failed to ${actionText.toLowerCase()} claim`;
    setError(msg);
  }
};

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    navigate('/login', { replace: true });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress size={60} color="primary" />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>

      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 5,
        pb: 2,
        borderBottom: '1px solid #e0e0e0'
      }}>
        <Typography variant="h4" component="h1" fontWeight="bold" color="primary">
          Admin Dashboard
        </Typography>

        <Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => fetchAdminData(localStorage.getItem('authToken'))}
            sx={{ mr: 2 }}
          >
            Refresh
          </Button>

          <Button
            variant="contained"
            color="error"
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
          >
            Logout
          </Button>
        </Box>
      </Box>

      {/* Messages */}
      {error && (
        <Alert severity="error" sx={{ mb: 4 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {successMsg && (
        <Alert severity="success" sx={{ mb: 4 }} onClose={() => setSuccessMsg('')}>
          {successMsg}
        </Alert>
      )}

     
      <Grid container spacing={3} sx={{ mb: 6 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card elevation={6} sx={{ borderRadius: 3, overflow: 'hidden' }}>
            <CardContent sx={{ textAlign: 'center', py: 5 }}>
              <UsersIcon sx={{ fontSize: 56, color: '#1976d2', mb: 2 }} />
              <Typography variant="h3" fontWeight="bold" color="primary">
                {stats.totalUsers}
              </Typography>
              <Typography variant="h6" color="text.secondary">
                Total Users
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card elevation={6} sx={{ borderRadius: 3, overflow: 'hidden' }}>
            <CardContent sx={{ textAlign: 'center', py: 5 }}>
              <ItemsIcon sx={{ fontSize: 56, color: '#1976d2', mb: 2 }} />
              <Typography variant="h3" fontWeight="bold" color="primary">
                {stats.totalItems}
              </Typography>
              <Typography variant="h6" color="text.secondary">
                Total Items
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card elevation={6} sx={{ borderRadius: 3, overflow: 'hidden' }}>
            <CardContent sx={{ textAlign: 'center', py: 5 }}>
              <PendingIcon sx={{ fontSize: 56, color: '#f57c00', mb: 2 }} />
              <Typography variant="h3" fontWeight="bold" color="warning.main">
                {stats.pendingClaims}
              </Typography>
              <Typography variant="h6" color="text.secondary">
                Pending Claims
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card elevation={6} sx={{ borderRadius: 3, overflow: 'hidden' }}>
            <CardContent sx={{ textAlign: 'center', py: 5 }}>
              <ResolvedIcon sx={{ fontSize: 56, color: '#2e7d32', mb: 2 }} />
              <Typography variant="h3" fontWeight="bold" color="success.main">
                {stats.resolvedItems}
              </Typography>
              <Typography variant="h6" color="text.secondary">
                Resolved Items
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Pending Claims Table */}
      <Paper elevation={6} sx={{ borderRadius: 3, overflow: 'hidden', mb: 4 }}>
        <Box sx={{ 
          p: 3, 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          backgroundColor: '#f8f9fa',
          borderBottom: '1px solid #e0e0e0'
        }}>
          <Typography variant="h6" component="h2" fontWeight="bold">
            Pending Claims
          </Typography>
          <IconButton 
            onClick={() => fetchAdminData(localStorage.getItem('authToken'))} 
            color="primary"
          >
            <RefreshIcon />
          </IconButton>
        </Box>

        {claims.length === 0 ? (
          <Box sx={{ p: 8, textAlign: 'center', color: 'text.secondary' }}>
            <Typography variant="h6" gutterBottom>
              No pending claims at the moment.
            </Typography>
            <Typography variant="body1">
              All claims have been processed.
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f1f5f9' }}>
                  <TableCell><strong>Item</strong></TableCell>
                  <TableCell><strong>Claimant</strong></TableCell>
                  <TableCell><strong>Date</strong></TableCell>
                  <TableCell align="right"><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {claims.map((claim) => (
                  <TableRow 
                    key={claim._id}
                    hover
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        {claim.itemId?.imageUrl && (
                          <img 
                            src={claim.itemId.imageUrl} 
                            alt="item"
                            style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8, border: '1px solid #e0e0e0' }}
                          />
                        )}
                        <Box>
                          <Typography variant="subtitle1" fontWeight={600}>
                            {claim.itemId?.description || 'Unnamed Item'}
                          </Typography>
                          <Chip 
                            label={claim.itemId?.category || 'Unknown'} 
                            size="small" 
                            color="primary" 
                            variant="outlined" 
                            sx={{ mt: 0.5 }}
                          />
                        </Box>
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {claim.claimantId?.name || 'Unknown User'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {claim.claimantId?.email}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      {new Date(claim.date).toLocaleString()}
                    </TableCell>

                    <TableCell align="right">
                      <Tooltip title="Approve">
                        <IconButton 
                          color="success" 
                          onClick={() => handleClaimAction(claim._id, 'approve')}
                          sx={{ mr: 1 }}
                        >
                          <ApproveIcon fontSize="large" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Reject">
                        <IconButton 
                          color="error" 
                          onClick={() => handleClaimAction(claim._id, 'reject')}
                        >
                          <RejectIcon fontSize="large" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Container>
  );
}