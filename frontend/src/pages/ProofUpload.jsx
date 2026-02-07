import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { authService } from '../utils/auth';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';
import './ProofUpload.css';

/**
 * ProofUpload - Secure camera-only proof submission
 * 
 * Security measures:
 * 1. Camera-only capture (no gallery access)
 * 2. Real-time geolocation at capture moment
 * 3. Server-side timestamp (not trusted from client)
 * 4. Image hash generated server-side from raw buffer
 * 
 * This deters proof manipulation while remaining hackathon-realistic
 */
const ProofUpload = () => {
  // Camera and capture state
  const [capturedImage, setCapturedImage] = useState(null);
  const [imageBlob, setImageBlob] = useState(null);
  const [geoLocation, setGeoLocation] = useState(null);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [locationStatus, setLocationStatus] = useState('waiting'); // waiting, fetching, success, error
  
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const user = authService.getUser();
  const societyId = user?.societyId?._id || user?.societyId;

  /**
   * Handle camera capture
   * Enforces camera-only input and captures live geolocation
   */
  const handleCameraCapture = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setError('');
    setLocationStatus('fetching');

    try {
      // Get live geolocation at the moment of capture
      const position = await getCurrentPosition();
      
      const location = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp
      };

      setGeoLocation(location);
      setLocationStatus('success');

      // Convert file to blob for upload
      setImageBlob(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setCapturedImage(reader.result);
      };
      reader.readAsDataURL(file);

      console.log('📸 Image captured with live location:', location);
    } catch (err) {
      setLocationStatus('error');
      setError(`Location error: ${err.message}. Please enable location services.`);
      
      // Clear the captured image since we need location
      e.target.value = '';
      setCapturedImage(null);
      setImageBlob(null);
    }
  };

  /**
   * Get current geolocation
   * Uses high accuracy mode for better precision
   */
  const getCurrentPosition = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported by browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        resolve,
        (error) => {
          let message = 'Location access denied';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              message = 'Location permission denied. Please enable in browser settings.';
              break;
            case error.POSITION_UNAVAILABLE:
              message = 'Location unavailable. Please try again.';
              break;
            case error.TIMEOUT:
              message = 'Location request timed out. Please try again.';
              break;
          }
          reject(new Error(message));
        },
        {
          enableHighAccuracy: true, // Request GPS-level accuracy
          timeout: 10000,           // 10 second timeout
          maximumAge: 0             // No cached positions - must be fresh
        }
      );
    });
  };

  /**
   * Submit proof to server
   * Server will:
   * - Set timestamp (not trusted from client)
   * - Generate image hash from buffer
   * - Validate geo-radius (500m)
   * - Check for duplicates
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);

    // Validation
    if (!imageBlob) {
      setError('Please capture an image using your camera');
      return;
    }

    if (!geoLocation) {
      setError('Location data is required. Please recapture with location enabled.');
      return;
    }

    setLoading(true);

    try {
      // Prepare FormData
      const formData = new FormData();
      formData.append('image', imageBlob, 'proof-capture.jpg');
      formData.append('societyId', societyId);
      
      // Send only coordinates - server will set timestamp
      formData.append('geoLocation', JSON.stringify({
        lat: geoLocation.lat,
        lng: geoLocation.lng
      }));

      console.log('📤 Uploading proof with live location:', geoLocation);

      const response = await apiService.uploadProof(formData);
      setResult(response.data.data);
      
      console.log('✅ Proof uploaded:', response.data.data.proof.logId);

      // Clear form on success
      setCapturedImage(null);
      setImageBlob(null);
      setGeoLocation(null);
      setLocationStatus('waiting');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('❌ Upload failed:', err);
      setError(err.response?.data?.message || 'Failed to upload proof');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Reset form
   */
  const handleReset = () => {
    setCapturedImage(null);
    setImageBlob(null);
    setGeoLocation(null);
    setLocationStatus('waiting');
    setError('');
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Layout title="Upload Waste Segregation Proof">
      <div className="upload-container">
        <div className="upload-grid">
          {/* Upload Form */}
          <div className="card">
            <div className="card-header">
              <h3>📸 Camera Capture Only</h3>
              <p className="text-sm text-gray-600">Take a live photo with location verification</p>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit} className="upload-form">
                {error && <div className="error-message">❌ {error}</div>}

                {/* Security Notice */}
                <div className="security-notice">
                  <div className="notice-icon">🔒</div>
                  <div className="notice-text">
                    <strong>Secure Proof Submission</strong>
                    <p>Camera-only capture with live location ensures authenticity</p>
                  </div>
                </div>

                {/* Camera Capture Input */}
                <div className="form-group">
                  <label htmlFor="camera-input">
                    Capture Image *
                    <span className="label-hint">Camera access required</span>
                  </label>
                  
                  {/* 
                    SECURITY: capture="environment" forces camera use
                    accept="image/*" restricts to images only
                    This prevents gallery uploads on most modern browsers
                  */}
                  <input
                    ref={fileInputRef}
                    id="camera-input"
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleCameraCapture}
                    required
                    className="file-input-camera"
                  />
                  
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="btn-camera"
                    disabled={loading}
                  >
                    📷 Open Camera
                  </button>

                  {/* Image Preview */}
                  {capturedImage && (
                    <div className="image-preview">
                      <img src={capturedImage} alt="Captured proof" />
                      <button
                        type="button"
                        onClick={handleReset}
                        className="btn-retake"
                      >
                        🔄 Retake Photo
                      </button>
                    </div>
                  )}
                </div>

                {/* Live Location Status */}
                <div className="form-group">
                  <label>Live Location Status</label>
                  
                  <div className={`location-status status-${locationStatus}`}>
                    {locationStatus === 'waiting' && (
                      <>
                        <span className="status-icon">⏳</span>
                        <span>Waiting for capture...</span>
                      </>
                    )}
                    
                    {locationStatus === 'fetching' && (
                      <>
                        <span className="status-icon spinner">🌐</span>
                        <span>Fetching live location...</span>
                      </>
                    )}
                    
                    {locationStatus === 'success' && geoLocation && (
                      <>
                        <span className="status-icon">✅</span>
                        <div className="location-details">
                          <span>Location captured</span>
                          <small>
                            Lat: {geoLocation.lat.toFixed(6)}, 
                            Lng: {geoLocation.lng.toFixed(6)}
                            {geoLocation.accuracy && ` (±${Math.round(geoLocation.accuracy)}m)`}
                          </small>
                        </div>
                      </>
                    )}
                    
                    {locationStatus === 'error' && (
                      <>
                        <span className="status-icon">❌</span>
                        <span>Location failed - please enable location services</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="btn-submit"
                  disabled={loading || !capturedImage || !geoLocation}
                >
                  {loading ? '⏳ Uploading & Verifying...' : '🚀 Submit Proof'}
                </button>

                {capturedImage && geoLocation && !loading && (
                  <p className="submit-hint">
                    ✓ Ready to submit. Server will validate location and timestamp.
                  </p>
                )}
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
                      <span className="label">Server Timestamp:</span>
                      <span className="value">
                        {new Date(result.proof.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="result-item">
                      <span className="label">Validation:</span>
                      <span className="value">{result.validation.reason}</span>
                    </div>
                    <div className="result-item">
                      <span className="label">Image Hash:</span>
                      <span className="value hash">{result.proof.imageHash.substring(0, 16)}...</span>
                    </div>
                  </div>

                  {result.proof.status === 'VERIFIED' && (
                    <div className="success-message">
                      ✅ Proof successfully verified! Compliance updated.
                    </div>
                  )}

                  {result.proof.status === 'FLAGGED' && (
                    <div className="warning-message">
                      ⚠️ {result.validation.reason}
                      <br />
                      <small>An admin will review this proof.</small>
                    </div>
                  )}

                  {result.proof.status === 'REJECTED' && (
                    <div className="error-message">
                      ❌ {result.validation.reason}
                      <br />
                      <small>Please submit a new proof.</small>
                    </div>
                  )}

                  <div className="result-actions">
                    <button
                      onClick={handleReset}
                      className="btn-secondary"
                    >
                      📸 Submit Another
                    </button>
                    <button
                      onClick={() => navigate('/secretary/dashboard')}
                      className="btn-dashboard"
                    >
                      📊 View Dashboard
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Security Guidelines Card */}
          <div className="card">
            <div className="card-header">
              <h3>🛡️ Security Guidelines</h3>
            </div>
            <div className="card-body">
              <div className="guidelines">
                <div className="guideline-item">
                  <span className="icon">📷</span>
                  <div>
                    <strong>Camera-Only Capture</strong>
                    <p>Live photos only - no gallery uploads allowed</p>
                  </div>
                </div>
                <div className="guideline-item">
                  <span className="icon">📍</span>
                  <div>
                    <strong>Live Location Required</strong>
                    <p>GPS location captured at photo time (±500m radius)</p>
                  </div>
                </div>
                <div className="guideline-item">
                  <span className="icon">⏱️</span>
                  <div>
                    <strong>Server Timestamp</strong>
                    <p>Upload time set by server (cannot be faked)</p>
                  </div>
                </div>
                <div className="guideline-item">
                  <span className="icon">🔐</span>
                  <div>
                    <strong>Duplicate Detection</strong>
                    <p>Each image hash is unique - prevents resubmission</p>
                  </div>
                </div>
              </div>

              <div className="security-note">
                <strong>🎯 Why These Measures?</strong>
                <p>
                  This system balances security with usability. While not 100% 
                  foolproof, it significantly raises the barrier for proof 
                  manipulation and creates an auditable trail for civic accountability.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProofUpload;