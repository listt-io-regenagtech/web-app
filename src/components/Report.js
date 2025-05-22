import React, { useState, useEffect } from 'react';
import Report from '../components/Report';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const ReportPage = () => {
  const [reportData, setReportData] = useState(null);
  const [fetchOption, setFetchOption] = useState('fetch');
  const [platform, setPlatform] = useState('Regenerative-AI');
  const [fileData, setFileData] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedSensor, setSelectedSensor] = useState('');
  const [selectedFile, setSelectedFile] = useState('');
  const [sensors, setSensors] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  const platformSensors = {
    RASR: ['RASR001-penetrometer-data', 'RASR001-agrisoundsensor-data', 'RASR001-wildlifesensing-data'],
    SmartPastures: ['Smartpastures001-grazing'],
    'Regenerative-AI': ['RegenAI001-Clover', 'RegenAI001-cloverflower', 'RegenAI001-dandelions', 'RegenAI001-thistles'],
  };

  const platformFiles = {
    RASR: ['RASR001-penetrometer-data.json', 'RASR001-agrisoundsensor-data.json', 'RASR001-wildlifesensing-data.json'],
    SmartPastures: ['Smartpastures001-grazing.json'],
    'Regenerative-AI': ['RegenAI001-Clover.json', 'RegenAI001-cloverflower.json', 'RegenAI001-dandelions.json', 'RegenAI001-thistles.json'],
  };

  useEffect(() => {
    if (fetchOption === 'fetch') {
      setSensors(platformSensors[platform] || []);
      setFiles(platformFiles[platform] || []);
    }
  }, [fetchOption, platform]);

  const handleFetchOptionChange = (e) => {
    setFetchOption(e.target.value);
    setStartDate('');
    setEndDate('');
    setSelectedSensor('');
    setSelectedFile('');
  };

  const handlePlatformChange = (e) => {
    setPlatform(e.target.value);
    setStartDate('');
    setEndDate('');
    setSelectedSensor('');
    setSelectedFile('');
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const fileContent = JSON.parse(reader.result);
        setFileData(fileContent);
      };
      reader.readAsText(file);
    }
  };

  const handleLoadData = async () => {
    if (!startDate || !endDate || !selectedSensor || !selectedFile) {
      alert('Please select a sensor, file, and date range!');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/report/${platform}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sensor: selectedSensor, file: selectedFile, startDate, endDate }),
      });
      const data = await response.json();
      setReportData(data);
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = () => {
    if (!selectedSensor || !selectedFile) {
      alert('Please select a sensor and file!');
      return;
    }
    handleLoadData();
  };

  return (
    <>
      <style>{`
        .report-page {
          padding: 10px;
          font-family: Arial, sans-serif;
        }

        .two-column {
          display: grid;
          grid-template-columns: 1fr 1fr;
          margin-bottom: 20px;
        }

        label {
          font-weight: bold;
          display: block;
          margin-bottom: 4px;
        }

        select, input[type="date"], input[type="file"] {
          width: 90%;
          padding: 8px;
          margin-bottom: 12px;
          border-radius: 4px;
          border: 1px solid #ccc;
        }


	.generate-report-btn {
	  padding: 10px 20px;
	  font-size: 16px;
	  border: none;
	  border-radius: 4px;
	  cursor: pointer;
	  background-color: #004f32;  /* Blue for Generate Report */
	  color: white;
	}

	.generate-report-btn:hover {
	  background-color: #2c6c44;
	}

	

        .map-container {
          margin-top: 30px;
          height: 500px;
          border-radius: 8px;
          overflow: hidden;
        }
      `}</style>

      <div className="report-page">
        <div className="two-column">
          <div>
            <label htmlFor="platform">Select Platform:</label>
            <select id="platform" value={platform} onChange={handlePlatformChange}>
              <option value="Regenerative-AI">Regenerative-AI</option>
              <option value="RASR">RASR</option>
              <option value="SmartPastures">SmartPastures</option>
            </select>
          </div>

          <div>
            <label htmlFor="fetch-option">Select Report Source:</label>
            <select id="fetch-option" value={fetchOption} onChange={handleFetchOptionChange}>
              <option value="fetch">Fetch Data Online</option>
              <option value="upload">Upload File</option>
            </select>
          </div>
        </div>

        {fetchOption === 'fetch' && (
          <>
            <div className="two-column">
              <div>
                <label htmlFor="start-date">Start Date:</label>
                <input type="date" id="start-date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div>
                <label htmlFor="end-date">End Date:</label>
                <input type="date" id="end-date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>

            <div className="two-column">
              <div>
                <label htmlFor="sensor">Select Sensor:</label>
                <select id="sensor" value={selectedSensor} onChange={(e) => setSelectedSensor(e.target.value)}>
                  <option value="">Select Sensor</option>
                  {sensors.map((sensor, idx) => (
                    <option key={idx} value={sensor}>{sensor}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="file">Select File:</label>
                <select id="file" value={selectedFile} onChange={(e) => setSelectedFile(e.target.value)}>
                  <option value="">Select File</option>
                  {files.map((file, idx) => (
                    <option key={idx} value={file}>{file}</option>
                  ))}
                </select>
              </div>
            </div>
          </>
        )}

        {fetchOption === 'upload' && (
          <div>
            <label htmlFor="file-upload">Upload JSON File:</label>
            <input type="file" id="file-upload" accept=".json" onChange={handleFileUpload} />
          </div>
        )}

        <div style={{ margin: '20px 0' }}>
          <button className="generate-report-btn" onClick={handleGenerate}>Generate Report</button>
          
        </div>

        {/* Dummy Map Displayed Below the Button */}
        <div className="map-container">
          <MapContainer center={[20, 0]} zoom={2} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </MapContainer>
        </div>

        {reportData && <Report data={reportData} />}
      </div>
    </>
  );
};

export default ReportPage;

