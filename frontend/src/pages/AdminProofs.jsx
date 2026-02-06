import { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';
import './AdminProofs.css';

const AdminProofs = () => {
  const [proofs, setProofs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchPendingProofs();
  }, []);

  const fetchPendingProofs = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiService.getPendingProofs();
      setProofs(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load pending proofs');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (logId) => {
    if (!confirm('Are you sure you want to approve this proof?')) return;

    setActionLoading(logId);
    try {
      await apiService.approveProof(logId);
      alert('Proof approved successfully');
      fetchPendingProofs(); // Refresh list
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve proof');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (logId) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;

    setActionLoading(logId);
    try {
      await apiService.rejectProof(logId, reason);
      alert('Proof rejected successfully');
      fetchPendingProofs(); // Refresh list
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject proof');
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Layout title="Review Pending Proofs">
      <div className="proofs-container">
        <div className="proofs-header">
          <div className="count-badge">
            {proofs.length} proof(s) pending review
          </div>
          <button onClick={fetchPendingProofs} className="btn-refresh">
            🔄 Refresh
          </button>
        </div>

        {loading && <div className="loading">Loading proofs...</div>}
        {error && <div className="error-box">{error}</div>}

        {!loading && !error && (
          <div className="proofs-grid">
            {proofs.map((proof) => (
              <div key={proof._id} className="proof-card">
                <div className="proof-image">
                  <img src={proof.imageUrl} alt="Proof" />
                  <StatusBadge status={proof.status} />
                </div>

                <div className="proof-details">
                  <div className="detail-row">
                    <span className="label">Proof ID:</span>
                    <span className="value">{proof.logId}</span>
                  </div>

                  <div className="detail-row">
                    <span className="label">Society:</span>
                    <span className="value">{proof.societyId?.name}</span>
                  </div>

                  <div className="detail-row">
                    <span className="label">Ward:</span>
                    <span className="value">{proof.societyId?.ward}</span>
                  </div>

                  <div className="detail-row">
                    <span className="label">Timestamp:</span>
                    <span className="value">{formatDate(proof.timestamp)}</span>
                  </div>

                  <div className="detail-row">
                    <span className="label">Uploaded by:</span>
                    <span className="value">{proof.uploadedBy?.name}</span>
                  </div>

                  <div className="detail-row full">
                    <span className="label">Location:</span>
                    <span className="value">
                      {proof.geoLocation.lat.toFixed(4)}, {proof.geoLocation.lng.toFixed(4)}
                    </span>
                  </div>

                  <div className="validation-reason">
                    <strong>Validation Issue:</strong>
                    <p>{proof.validationReason}</p>
                  </div>

                  <div className="proof-actions">
                    <button
                      onClick={() => handleApprove(proof._id)}
                      className="btn-approve"
                      disabled={actionLoading === proof._id}
                    >
                      {actionLoading === proof._id ? 'Processing...' : '✓ Approve'}
                    </button>
                    <button
                      onClick={() => handleReject(proof._id)}
                      className="btn-reject"
                      disabled={actionLoading === proof._id}
                    >
                      {actionLoading === proof._id ? 'Processing...' : '✗ Reject'}
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {proofs.length === 0 && (
              <div className="no-proofs">
                <div className="icon">✅</div>
                <h3>All Clear!</h3>
                <p>No proofs pending review at the moment.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AdminProofs;