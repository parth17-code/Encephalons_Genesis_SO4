import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { authService } from '../utils/auth';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';
import './ProofUpload.css';

const ProofUpload = () => {
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [latitude, setLatitude] = useState('19.0760');
  const [longitude, setLongitude] = useState('72.8777');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const user = authService.getUser();
  const societyId = user?.societyId?._id || user?.societyId;

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude.toFixed(4));
          setLongitude(position.coords.longitude.toFixed(4));
        },
        (error) => {
          alert('Could not get location: ' + error.message);
        }
      );
    } else {
      alert('Geolocation is not supported by your browser');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);

    if (!image) {
      setError('Please select an image');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('image', image);
      formData.append('societyId', societyId);
      formData.append('geoLocation', JSON.stringify({
        lat: parseFloat(latitude),
        lng: parseFloat(longitude)
      }));

      const response = await apiService.uploadProof(formData);
      setResult(response.data.data);
      
      // Clear form on success
      setImage(null);
      setImagePreview(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload proof');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Upload Waste Segregation Proof">
      <div className="upload-container">
        <div className="upload-grid">
          {/* Upload Form */}
          <div className="card">
            <div className="card-header">
              <h3>Submit Proof</h3>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit} className="upload-form">
                {error && <div className="error-message">{error}</div>}

                <div className="form-group">
                  <label htmlFor="image">Image *</label>
                  <input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    required
                  />
                  {imagePreview && (
                    <div className="image-preview">
                      <img src={imagePreview} alt="Preview" />
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label>Geolocation *</label>
                  <div className="geo-inputs">
                    <input
                      type="number"
                      step="0.0001"
                      value={latitude}
                      onChange={(e) => setLatitude(e.target.value)}
                      placeholder="Latitude"
                      required
                    />
                    <input
                      type="number"
                      step="0.0001"
                      value={longitude}
                      onChange={(e) => setLongitude(e.target.value)}
                      placeholder="Longitude"
                      required
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleGetLocation}
                    className="btn-geo"
                  >
                    📍 Get Current Location
                  </button>
                </div>

                <button
                  type="submit"
                  className="btn-submit"
                  disabled={loading}
                >
                  {loading ? 'Uploading...' : 'Upload Proof'}
                </button>
              </form>
            </div>
          </div>

          {/* Result Card */}
          {result && (
            <div className="card">
              <div className="card-header">
                <h3>Upload Result</h3>
              </div>
              <div className="card-body">
                <div className="result-display">
                  <div className="result-status">
                    <StatusBadge status={result.proof.status} />
                  </div>
                  
                  <div className="result-details">
                    <div className="result-item">
                      <span className="label">Proof ID:</span>
                      <span className="value">{result.proof.logId}</span>
                    </div>
                    <div className="result-item">
                      <span className="label">Timestamp:</span>
                      <span className="value">
                        {new Date(result.proof.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="result-item">
                      <span className="label">Validation:</span>
                      <span className="value">{result.validation.reason}</span>
                    </div>
                  </div>

                  {result.proof.status === 'VERIFIED' && (
                    <div className="success-message">
                      ✅ Proof successfully verified! Compliance updated.
                    </div>
                  )}

                  {result.proof.status === 'FLAGGED' && (
                    <div className="warning-message">
                      ⚠️ Proof flagged for review. An admin will review it.
                    </div>
                  )}

                  {result.proof.status === 'REJECTED' && (
                    <div className="error-message">
                      ❌ Proof rejected. Please upload a new proof.
                    </div>
                  )}

                  <button
                    onClick={() => navigate('/secretary/dashboard')}
                    className="btn-dashboard"
                  >
                    Back to Dashboard
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Instructions Card */}
          <div className="card">
            <div className="card-header">
              <h3>Upload Guidelines</h3>
            </div>
            <div className="card-body">
              <div className="guidelines">
                <div className="guideline-item">
                  <span className="icon">📷</span>
                  <div>
                    <strong>Clear Image</strong>
                    <p>Take a clear photo of segregated waste bins</p>
                  </div>
                </div>
                <div className="guideline-item">
                  <span className="icon">📍</span>
                  <div>
                    <strong>Correct Location</strong>
                    <p>Must be within 500m of society location</p>
                  </div>
                </div>
                <div className="guideline-item">
                  <span className="icon">⏰</span>
                  <div>
                    <strong>Recent Upload</strong>
                    <p>Upload within 30 minutes of taking photo</p>
                  </div>
                </div>
                <div className="guideline-item">
                  <span className="icon">🔒</span>
                  <div>
                    <strong>No Duplicates</strong>
                    <p>Each proof must be unique</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProofUpload;