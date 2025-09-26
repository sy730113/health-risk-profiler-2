import { useState, useEffect } from 'react';
import { api } from './api';
import './index.css';

function App() {
  const [file, setFile] = useState(null);
  const [textInput, setTextInput] = useState('');
  const [jsonInput, setJsonInput] = useState(
    '{"age":42,"smoker":true,"exercise":"rarely","diet":"high sugar"}'
  );
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [inputType, setInputType] = useState('json');
  const [fileName, setFileName] = useState('');
  const [apiStatus, setApiStatus] = useState(null);

  // Check API health on component mount
  useEffect(() => {
    const checkApiHealth = async () => {
      try {
        const response = await api.get('/health');
        setApiStatus(response.data);
      } catch (error) {
        setApiStatus({ status: 'error', message: 'API connection failed' });
        console.log(error);
      }
    };
    checkApiHealth();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      let response;

      if (inputType === 'image' && file) {
        const formData = new FormData();
        formData.append('image', file);
        
        response = await api.post('/profile/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      } else if (inputType === 'text' && textInput.trim()) {
        response = await api.post('/profile', { 
          text: textInput
        });
      } else if (inputType === 'json' && jsonInput.trim()) {
        const jsonData = JSON.parse(jsonInput);
        response = await api.post('/profile', jsonData);
      } else {
        alert('Please provide valid input');
        setLoading(false);
        return;
      }

      setResult(response.data);
    } catch (err) {
      console.error('Request failed:', err);
      alert('Analysis failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
    }
  };

  const getRiskColor = (riskLevel) => {
    switch (riskLevel?.toLowerCase()) {
      case 'high': return '#e74c3c';
      case 'medium': return '#f39c12';
      case 'low': return '#27ae60';
      default: return '#95a5a6';
    }
  };

  const getRiskIcon = (riskLevel) => {
    switch (riskLevel?.toLowerCase()) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  };

  const sampleText = `Age: 42
Smoker: yes
Exercise: rarely
Diet: high sugar
Alcohol: occasionally
Family history: heart disease`;

  return (
    <div className="container">
      <header>
        <h1>🏥 Health Risk Profiler</h1>
        <p>AI-powered analysis of lifestyle surveys for comprehensive health risk assessment</p>
        
        {/* API Status Indicator */}
        <div className={`api-status ${apiStatus?.ai_status || 'unknown'}`}>
          <span className="status-dot"></span>
          {apiStatus?.ai_status === 'connected' ? '🤖 AI Connected' : 
           apiStatus?.ai_status === 'disconnected' ? '⚠️ AI Offline' : '🔌 Checking API...'}
        </div>
      </header>

      <div className="content">
        {/* Beautiful Input Type Selection */}
        <div className="input-selector-section">
          <h2 className="section-title">📋 Choose Your Input Method</h2>
          <p className="section-subtitle">Select how you'd like to provide health data for analysis</p>
          
          <div className="input-type-cards">
            <div 
              className={`input-card ${inputType === 'json' ? 'selected' : ''}`}
              onClick={() => setInputType('json')}
            >
              <div className="card-icon">📊</div>
              <h3>JSON Input</h3>
              <p>Paste structured JSON data</p>
              <div className="card-features">
                <span>⚡ Fast processing</span>
                <span>🎯 Precise formatting</span>
              </div>
            </div>

            <div 
              className={`input-card ${inputType === 'text' ? 'selected' : ''}`}
              onClick={() => setInputType('text')}
            >
              <div className="card-icon">📝</div>
              <h3>Text Input</h3>
              <p>Type or paste health information</p>
              <div className="card-features">
                <span>💬 Natural language</span>
                <span>🔤 Flexible format</span>
              </div>
            </div>

            <div 
              className={`input-card ${inputType === 'image' ? 'selected' : ''}`}
              onClick={() => setInputType('image')}
            >
              <div className="card-icon">🖼️</div>
              <h3>Image Upload</h3>
              <p>Upload survey forms or images</p>
              <div className="card-features">
                <span>👁️ AI vision analysis</span>
                <span>📸 Photo support</span>
              </div>
            </div>
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="input-form">
          {inputType === 'image' && (
            <div className="input-section">
              <h2>📁 Upload Health Survey Image</h2>
              <div className="file-upload-area">
                <label className="file-upload-label">
                  <input
                    type="file"
                    accept="image/*,.pdf,.txt"
                    onChange={handleFileChange}
                    className="file-input"
                  />
                  <div className="upload-content">
                    <div className="upload-icon">📎</div>
                    <div className="upload-text">
                      <span className="upload-title">Choose a file</span>
                      <span className="upload-subtitle">or drag and drop here</span>
                    </div>
                  </div>
                </label>
                {fileName && (
                  <div className="file-preview">
                    <span className="file-icon">📄</span>
                    <span className="file-name">{fileName}</span>
                  </div>
                )}
              </div>
              <p className="file-hint">
                📸 Supported formats: JPG, PNG, PDF, TXT files (Max: 10MB)
              </p>
            </div>
          )}

          {inputType === 'text' && (
            <div className="input-section">
              <h2>📝 Enter Health Information</h2>
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder={sampleText}
                rows={8}
                className="health-textarea"
              />
              <div className="input-guide">
                <h4>💡 Format Examples:</h4>
                <div className="guide-examples">
                  <code>Age: 42</code>
                  <code>Smoker: yes</code>
                  <code>Exercise: rarely</code>
                  <code>Diet: high sugar</code>
                </div>
              </div>
            </div>
          )}

          {inputType === 'json' && (
            <div className="input-section">
              <h2>📊 JSON Health Data</h2>
              <div className="json-input-container">
                <textarea
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  rows={8}
                  className="json-textarea"
                />
              </div>
              <div className="json-validator">
                <span className="validator-icon">✅</span>
                <span>Valid JSON format</span>
              </div>
            </div>
          )}

          <button type="submit" disabled={loading} className="submit-button">
            {loading ? (
              <>
                <span className="spinner"></span>
                🔍 Analyzing Health Data...
              </>
            ) : (
              '🚀 Analyze Health Risk'
            )}
          </button>
        </form>

        {/* Results Section */}
        {result && (
          <div className="results">
            <div className="results-header">
              <h2>📈 Health Analysis Results</h2>
              <span className="analysis-badge">
                {result.analysis?.source === 'ai' ? '🤖 AI Analysis' : 
                 result.analysis?.source === 'ai_vision' ? '👁️ Vision Analysis' : 
                 '📊 Local Analysis'}
              </span>
            </div>
            
            {/* Non-Health Data Warning */}
            {!result.is_health_data && result.message && (
              <div className="warning-card">
                <div className="warning-icon">⚠️</div>
                <div className="warning-content">
                  <h3>No Health Data Detected</h3>
                  <p>{result.message}</p>
                  {result.suggestion && (
                    <div className="suggestion-box">
                      <strong>💡 Try entering health information like:</strong>
                      <p>{result.suggestion}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Success Results */}
            {result.status === 'ok' && result.analysis && (
              <div className="success-results">
                {/* Extracted Text from Image */}
                {result.extracted_text && (
                  <div className="info-card">
                    <h3>📖 Text Extracted from Image</h3>
                    <div className="extracted-text">
                      {result.extracted_text}
                    </div>
                  </div>
                )}

                {/* Risk Assessment Card */}
                <div className="risk-card" style={{ borderLeftColor: getRiskColor(result.analysis.risk_level) }}>
                  <div className="risk-header">
                    <span className="risk-icon">{getRiskIcon(result.analysis.risk_level)}</span>
                    <h3>Risk Assessment</h3>
                  </div>
                  <div className="risk-content">
                    <div className="risk-level-display">
                      <span className="risk-level-badge" style={{ backgroundColor: getRiskColor(result.analysis.risk_level) }}>
                        {result.analysis.risk_level?.toUpperCase() || 'N/A'}
                      </span>
                      <div className="risk-score">
                        <span className="score-number">{result.analysis.score || 'N/A'}</span>
                        <span className="score-label">/100</span>
                      </div>
                    </div>
                    {result.analysis.rationale && (
                      <div className="rationale">
                        <strong>📋 Analysis Notes:</strong>
                        <p>{result.analysis.rationale}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Risk Factors */}
                {result.analysis.factors && result.analysis.factors.length > 0 && (
                  <div className="factors-card">
                    <h3>🔍 Identified Risk Factors</h3>
                    <div className="factors-grid">
                      {result.analysis.factors.map((factor, index) => (
                        <div key={index} className="factor-item">
                          <span className="factor-icon">⚠️</span>
                          {factor}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {result.analysis.recommendations && result.analysis.recommendations.length > 0 && (
                  <div className="recommendations-card">
                    <h3>💡 Health Recommendations</h3>
                    <div className="recommendations-list">
                      {result.analysis.recommendations.map((rec, index) => (
                        <div key={index} className="recommendation-item">
                          <span className="rec-icon">✅</span>
                          <span className="rec-text">{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Analysis Details */}
                <div className="analysis-meta">
                  <div className="meta-item">
                    <strong>🕒 Analysis Time:</strong> 
                    <span>{new Date(result.timestamp).toLocaleString()}</span>
                  </div>
                  <div className="meta-item">
                    <strong>📊 Input Type:</strong> 
                    <span>{result.input_type}</span>
                  </div>
                  {result.file_type && (
                    <div className="meta-item">
                      <strong>📁 File Type:</strong> 
                      <span>{result.file_type}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Debug Info */}
            <details className="debug-section">
              <summary>🔧 Raw Response Data (For Debugging)</summary>
              <pre className="debug-json">{JSON.stringify(result, null, 2)}</pre>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;