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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
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
  Visibility as ViewIcon,
  ThumbUp as ApprovedIcon,
  ThumbDown as RejectedIcon,
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
    approvedClaims: 0,
    rejectedClaims: 0,
  });
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Modal state
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [claimDetails, setClaimDetails] = useState([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);

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

  const fetchClaimDetails = async (claimId) => {
    setDetailsLoading(true);
    setClaimDetails([]);

    try {
      const token = localStorage.getItem('authToken');
      const res = await axios.get(`${API_BASE}/api/claimDetails/claim/${claimId}/details`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClaimDetails(res.data || []);
    } catch (err) {
      console.error('Fetch claim details error:', err);
      setClaimDetails([]);
    } finally {
      setDetailsLoading(false);
    }
  };

  const openDetailsModal = (claim) => {
    setSelectedClaim(claim);
    fetchClaimDetails(claim._id);
    setOpenModal(true);
  };

  const handleClaimAction = async (claimId, action) => {
    const status = action === 'approve' ? 'approved' : 'rejected';
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
      setOpenModal(false);
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
    <Container maxWidth="xl" sx={{ py: { xs: 2, md: 4 } }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: { xs: 3, md: 5 },
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

      {/* Stats Cards – Improved spacing & responsiveness */}
      <Grid container spacing={{ xs: 3, md: 4 }} sx={{ mb: { xs: 4, md: 6 } }}>
        {/* Total Users */}
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <Card elevation={6} sx={{ borderRadius: 3, overflow: 'hidden', height: '100%' }}>
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

        {/* Total Items – wider on medium screens */}
        <Grid item xs={12} sm={6} md={6} lg={3}>
          <Card elevation={6} sx={{ borderRadius: 3, overflow: 'hidden', height: '100%' }}>
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

        {/* Pending Claims */}
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <Card elevation={6} sx={{ borderRadius: 3, overflow: 'hidden', height: '100%' }}>
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

       

        {/* Approved Claims */}
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <Card elevation={6} sx={{ borderRadius: 3, overflow: 'hidden', height: '100%' }}>
            <CardContent sx={{ textAlign: 'center', py: 5 }}>
              <ApprovedIcon sx={{ fontSize: 56, color: '#4caf50', mb: 2 }} />
              <Typography variant="h3" fontWeight="bold" color="success.main">
                {stats.approvedClaims || 0}
              </Typography>
              <Typography variant="h6" color="text.secondary">
                Approved Claims
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Rejected Claims */}
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <Card elevation={6} sx={{ borderRadius: 3, overflow: 'hidden', height: '100%' }}>
            <CardContent sx={{ textAlign: 'center', py: 5 }}>
              <RejectedIcon sx={{ fontSize: 56, color: '#f44336', mb: 2 }} />
              <Typography variant="h3" fontWeight="bold" color="error.main">
                {stats.rejectedClaims || 0}
              </Typography>
              <Typography variant="h6" color="text.secondary">
                Rejected Claims
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
                      <Tooltip title="View Details & ID">
                        <IconButton 
                          color="primary"
                          onClick={() => openDetailsModal(claim)}
                          sx={{ mr: 1 }}
                        >
                          <ViewIcon fontSize="large" />
                        </IconButton>
                      </Tooltip>

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

      {/* Details Modal */}
      <Dialog 
        open={openModal} 
        onClose={() => setOpenModal(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Claim Details - {selectedClaim?.itemId?.description || 'Item'}
        </DialogTitle>
        <DialogContent dividers>
          {detailsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : claimDetails.length === 0 ? (
            <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
              No additional details or ID photo submitted yet.
            </Typography>
          ) : (
            claimDetails.map((detail) => (
              <Box key={detail._id} sx={{ mb: 4 }}>
                {detail.content && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Submitted Text:
                    </Typography>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                      {detail.content}
                    </Typography>
                  </Box>
                )}

                {detail.imageUrl && (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Uploaded ID/Photo:
                    </Typography>
                    <img 
                      src={detail.imageUrl} 
                      alt="User ID Photo" 
                      style={{ 
                        maxWidth: '100%', 
                        maxHeight: 400, 
                        borderRadius: 8, 
                        border: '1px solid #ddd',
                        objectFit: 'contain'
                      }}
                    />
                  </Box>
                )}

                <Divider sx={{ my: 3 }} />
              </Box>
            ))
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenModal(false)}>Close</Button>
          {selectedClaim && (
            <>
              <Button 
                color="success" 
                variant="contained"
                onClick={() => handleClaimAction(selectedClaim._id, 'approve')}
                disabled={selectedClaim.status !== 'pending'}
              >
                Approve
              </Button>
              <Button 
                color="error" 
                variant="contained"
                onClick={() => handleClaimAction(selectedClaim._id, 'reject')}
                disabled={selectedClaim.status !== 'pending'}
              >
                Reject
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
}