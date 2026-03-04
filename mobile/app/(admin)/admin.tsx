
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Platform,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';

const API_BASE = 'https://astu-student-api-1f9k.onrender.com';
const { width, height } = Dimensions.get('window');

export default function AdminDashboard() {
  const router = useRouter();

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalItems: 0,
    pendingClaims: 0,
    resolvedItems: 0,
    approvedClaims: 0,
    rejectedClaims: 0,
  });

  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  const [selectedClaim, setSelectedClaim] = useState<any>(null);
  const [claimDetails, setClaimDetails] = useState<any[]>([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    checkAuthAndLoad();
  }, []);

  const checkAuthAndLoad = async () => {
    try {
      const token = await SecureStore.getItemAsync('authToken');
      const userJson = await SecureStore.getItemAsync('user');

      if (!token || !userJson) {
        router.replace('/login');
        return;
      }

      const user = JSON.parse(userJson);
      if (user.role !== 'admin') {
        await SecureStore.deleteItemAsync('authToken');
        await SecureStore.deleteItemAsync('user');
        router.replace('/login');
        return;
      }

      fetchAdminData(token);
    } catch (err) {
      console.error('Auth check error:', err);
      router.replace('/login');
    }
  };

  const fetchAdminData = async (token: string) => {
    setLoading(true);
    setError(null);

    try {
      const statsRes = await axios.get(`${API_BASE}/api/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStats(statsRes.data);

      const claimsRes = await axios.get(`${API_BASE}/api/claims/pending`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setClaims(claimsRes.data || []);
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.message || 'Failed to load admin data';
      setError(msg);

      if (err.response?.status === 401 || err.response?.status === 403) {
        await SecureStore.deleteItemAsync('authToken');
        await SecureStore.deleteItemAsync('user');
        router.replace('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchClaimDetails = async (claimId: string) => {
    setDetailsLoading(true);
    setClaimDetails([]);

    try {
      const token = await SecureStore.getItemAsync('authToken');
      if (!token) return;

      const res = await axios.get(`${API_BASE}/api/claimDetails/claim/${claimId}/details`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setClaimDetails(res.data || []);
    } catch (err) {
      console.error(err);
      setClaimDetails([]);
    } finally {
      setDetailsLoading(false);
    }
  };

  const openDetails = (claim: any) => {
    setSelectedClaim(claim);
    fetchClaimDetails(claim._id);
    setModalVisible(true);
  };

  const handleClaimAction = (claimId: string, action: 'approve' | 'reject') => {
    const status = action === 'approve' ? 'approved' : 'rejected';
    const actionText = action === 'approve' ? 'Approve' : 'Reject';

    Alert.alert(
      `${actionText} Claim`,
      `Are you sure you want to ${actionText.toLowerCase()} this claim?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: actionText,
          style: action === 'approve' ? 'default' : 'destructive',
          onPress: async () => {
            const token = await SecureStore.getItemAsync('authToken');
            if (!token) return;

            try {
              await axios.put(
                `${API_BASE}/api/claims/${claimId}`,
                { status },
                { headers: { Authorization: `Bearer ${token}` } }
              );

              setSuccessMsg(`Claim ${actionText.toLowerCase()}d successfully!`);
              setModalVisible(false);
              fetchAdminData(token);
            } catch (err: any) {
              const msg = err.response?.data?.message || `Failed to ${actionText.toLowerCase()} claim`;
              setError(msg);
            }
          },
        },
      ]
    );
  };

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync('authToken');
    await SecureStore.deleteItemAsync('user');
    router.replace('/login');
  };

  const onRefresh = async () => {
    const token = await SecureStore.getItemAsync('authToken');
    if (token) await fetchAdminData(token);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4f46e5" />

      {/* Sticky Header */}
      <LinearGradient
        colors={['#4f46e5', '#6366f1']}
        style={styles.stickyHeader}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Admin Dashboard</Text>

          <View style={styles.headerButtons}>
            <TouchableOpacity style={styles.iconButton} onPress={onRefresh}>
              <Text style={styles.iconText}>↻</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={onRefresh}
            colors={['#6366f1']}
            tintColor="#6366f1"
          />
        }
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 40 }}
      >
        {/* Messages */}
        {error && <Text style={styles.errorText}>{error}</Text>}
        {successMsg && <Text style={styles.successText}>{successMsg}</Text>}

        {/* Stats Cards */}
        <View style={styles.statsGrid}>
          <StatCard
            label="Total Users"
            value={stats.totalUsers}
            color="#3b82f6"
            icon="👥"
          />
          <StatCard
            label="Total Items"
            value={stats.totalItems}
            color="#3b82f6"
            icon="📦"
          />
          <StatCard
            label="Pending Claims"
            value={stats.pendingClaims}
            color="#f59e0b"
            icon="⏳"
          />
          <StatCard
            label="Approved"
            value={stats.approvedClaims || 0}
            color="#10b981"
            icon="✅"
          />
          <StatCard
            label="Rejected"
            value={stats.rejectedClaims || 0}
            color="#ef4444"
            icon="❌"
          />
        </View>

        {/* Pending Claims Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Pending Claims</Text>
          <TouchableOpacity onPress={onRefresh}>
            <Text style={styles.refreshText}>Refresh</Text>
          </TouchableOpacity>
        </View>

        {claims.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No pending claims at the moment</Text>
            <Text style={styles.emptySubText}>All claims have been processed</Text>
          </View>
        ) : (
          <FlatList
            data={claims}
            scrollEnabled={false}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <View style={styles.claimCard}>
                <View style={styles.claimHeader}>
                  {item.itemId?.imageUrl && (
                    <Image
                      source={{ uri: item.itemId.imageUrl }}
                      style={styles.claimImage}
                    />
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.claimTitle}>
                      {item.itemId?.description || 'Unnamed Item'}
                    </Text>
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryText}>
                        {item.itemId?.category || 'Unknown'}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.claimInfo}>
                  <Text style={styles.claimantName}>
                    {item.claimantId?.name || 'Unknown User'}
                  </Text>
                  <Text style={styles.claimantEmail}>
                    {item.claimantId?.email}
                  </Text>
                  <Text style={styles.claimDate}>
                    {new Date(item.date).toLocaleString()}
                  </Text>
                </View>

                <View style={styles.claimActions}>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.viewBtn]}
                    onPress={() => openDetails(item)}
                  >
                    <Text style={styles.actionText}>View</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, styles.approveBtn]}
                    onPress={() => handleClaimAction(item._id, 'approve')}
                  >
                    <Text style={styles.actionText}>Approve</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, styles.rejectBtn]}
                    onPress={() => handleClaimAction(item._id, 'reject')}
                  >
                    <Text style={styles.actionText}>Reject</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        )}
      </ScrollView>

      {/* Details Modal */}
      {modalVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Claim Details - {selectedClaim?.itemId?.description || 'Item'}
            </Text>

            {detailsLoading ? (
              <ActivityIndicator size="large" color="#6366f1" style={{ margin: 40 }} />
            ) : claimDetails.length === 0 ? (
              <Text style={styles.modalEmpty}>
                No additional details or photo submitted.
              </Text>
            ) : (
              claimDetails.map((detail: any) => (
                <View key={detail._id} style={styles.detailItem}>
                  {detail.content && (
                    <>
                      <Text style={styles.detailLabel}>Submitted Text:</Text>
                      <Text style={styles.detailContent}>{detail.content}</Text>
                    </>
                  )}

                  {detail.imageUrl && (
                    <>
                      <Text style={[styles.detailLabel, { marginTop: 16 }]}>
                        Uploaded Photo/ID:
                      </Text>
                      <Image
                        source={{ uri: detail.imageUrl }}
                        style={styles.modalImage}
                        resizeMode="contain"
                      />
                    </>
                  )}
                </View>
              ))
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalBtnText}>Close</Text>
              </TouchableOpacity>

              {selectedClaim?.status === 'pending' && (
                <>
                  <TouchableOpacity
                    style={[styles.modalActionBtn, styles.modalApprove]}
                    onPress={() => handleClaimAction(selectedClaim._id, 'approve')}
                  >
                    <Text style={styles.modalBtnText}>Approve</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalActionBtn, styles.modalReject]}
                    onPress={() => handleClaimAction(selectedClaim._id, 'reject')}
                  >
                    <Text style={styles.modalBtnText}>Reject</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

// ────────────────────────────────────────────────
// Stat Card Component
// ────────────────────────────────────────────────
function StatCard({ label, value, color, icon }: {
  label: string;
  value: number;
  color: string;
  icon: string;
}) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
  },

  // Sticky Header
  stickyHeader: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 44,
    paddingHorizontal: 20,
    paddingBottom: 16,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    zIndex: 1000,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop:10
  },
  headerTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  iconButton: {
    width: 35,
    height: 35,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  logoutButton: {
    padding:7,
    marginLeft:10,
    backgroundColor: 'rgba(239,68,68,0.9)',
    borderRadius: 12,
  },
  logoutText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 15,
  },

  // Messages
  errorText: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    margin: 16,
    padding: 12,
    borderRadius: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  successText: {
    backgroundColor: '#d1fae5',
    color: '#065f46',
    margin: 16,
    padding: 12,
    borderRadius: 12,
    textAlign: 'center',
    fontWeight: '500',
  },

  // Stats
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: width < 400 ? '45%' : '30%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 5,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  statIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '800',
  },
  statLabel: {
    color: '#64748b',
    fontSize: 14,
    marginTop: 4,
    fontWeight: '500',
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
  },
  refreshText: {
    color: '#6366f1',
    fontWeight: '600',
    fontSize: 15,
  },

  // Claim Cards
  claimCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    padding: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  claimHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  claimImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
  },
  claimTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1e293b',
  },
  categoryBadge: {
    backgroundColor: '#e0e7ff',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 6,
  },
  categoryText: {
    color: '#6366f1',
    fontSize: 12,
    fontWeight: '600',
  },
  claimInfo: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  claimantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  claimantEmail: {
    color: '#64748b',
    fontSize: 14,
  },
  claimDate: {
    color: '#94a3b8',
    fontSize: 13,
    marginTop: 4,
  },
  claimActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 16,
  },
  actionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  viewBtn: {
    backgroundColor: '#e0e7ff',
  },
  approveBtn: {
    backgroundColor: '#d1fae5',
  },
  rejectBtn: {
    backgroundColor: '#fee2e2',
  },
  actionText: {
    fontWeight: '600',
    fontSize: 14,
  },

  // Empty state
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  emptySubText: {
    color: '#94a3b8',
    fontSize: 15,
    textAlign: 'center',
  },

  // Modal
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
  },
  modalContent: {
    backgroundColor: 'white',
    width: width * 0.88,
    maxHeight: height * 0.82,
    borderRadius: 24,
    padding: 24,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 16,
  },
  modalEmpty: {
    textAlign: 'center',
    color: '#64748b',
    fontSize: 16,
    paddingVertical: 40,
  },
  detailItem: {
    marginBottom: 24,
  },
  detailLabel: {
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
    fontSize: 15,
  },
  detailContent: {
    color: '#334155',
    fontSize: 15,
    lineHeight: 22,
  },
  modalImage: {
    width: '100%',
    height: 260,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 8,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 20,
  },
  modalCloseBtn: {
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#4a4d51',
  },
  modalActionBtn: {
     paddingHorizontal: 10,
    paddingVertical: 12,
    borderRadius: 12,
  },
  modalApprove: {
    backgroundColor: '#10b981',
  },
  modalReject: {
    backgroundColor: '#ef4444',
  },
  modalBtnText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 15,
  },
});