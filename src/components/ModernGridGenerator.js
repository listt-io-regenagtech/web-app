import React, { useState, useEffect } from "react";
import { saveAs } from "file-saver";
import {
  Card,
  Button,
  Select,
  Input,
  Form,
  Row,
  Col,
  Space,
  Typography,
  Upload,
  Radio,
  InputNumber,
  Checkbox,
  message,
  Divider,
  AutoComplete
} from "antd";
import { brandConfig } from "../config/brandConfig";
import {
  UploadOutlined,
  PlusOutlined,
  MinusOutlined,
  ClearOutlined,
  DownloadOutlined,
  EnvironmentOutlined,
  SearchOutlined,
  ReloadOutlined
} from "@ant-design/icons";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup,
  Tooltip,
  CircleMarker,
  useMap,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const { Title, Text } = Typography;
const { Option } = Select;

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

/* ------------------ Helpers ------------------ */
function lerp(a, b, t) {
  return { lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t };
}
function isPointInPolygon(pt, poly) {
  let x = pt.lng, y = pt.lat, inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].lng, yi = poly[i].lat;
    const xj = poly[j].lng, yj = poly[j].lat;
    const intersect =
      yi > y !== yj > y &&
      x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}
function indexToLabel(i) {
  return String.fromCharCode(65 + i);
}

/* --------------- Map helpers --------------- */
function ZoomToBounds({ boundary, gridPoints }) {
  const map = useMap();
  useEffect(() => {
    const all = [...boundary, ...gridPoints];
    if (!all.length) return;
    map.fitBounds(L.latLngBounds(all.map(p => [p.lat, p.lng])), { padding: [50,50] });
  }, [boundary, gridPoints, map]);
  return null;
}
function ManualBoundaryHandler({ isActive, onSelect }) {
  useMapEvents({
    click(e) { if (isActive) onSelect(e.latlng); }
  });
  return null;
}
function RecenterOnLocation({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords) map.setView(coords, 14);
  }, [coords, map]);
  return null;
}

export default function ModernGridGenerator() {
  /* ---- Boundary states ---- */
  const [boundaryMethod, setBoundaryMethod] = useState("file");
  const [cornerCoords, setCornerCoords] = useState([]);
  const [manualPts, setManualPts] = useState([]);
  const [isSelectingBoundary, setIsSelectingBoundary] = useState(false);

  /* ---- Grid & pattern ---- */
  const [gridSizeX, setGridSizeX] = useState(3);
  const [gridSizeY, setGridSizeY] = useState(3);
  const [startCorner, setStartCorner] = useState(0);   // 0=A,1=B,2=C,3=D
  const [traversal, setTraversal] = useState("CW");    // "CW" or "CCW"
  const [gridPoints, setGridPoints] = useState([]);

  /* ---- Selection & exports ---- */
  const [mode, setMode] = useState("NONE"); // "NONE","ADD","DELETE"
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [isDefiningArea, setIsDefiningArea] = useState(false);
  const [areaSelIndices, setAreaSelIndices] = useState([]);
  const [filename, setFilename] = useState("mygrid");

  /* ---- Map & search ---- */
  const [mapInstance, setMapInstance] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [locationCoords, setLocationCoords] = useState(null);

  const [taggingMode, setTaggingMode] = useState(false);
  const [selectedTagPointIndex, setSelectedTagPointIndex] = useState(null);
  const [toolAssignments, setToolAssignments] = useState({});
  const [toolSelection, setToolSelection] = useState([]);
  const [bulkToolSelection, setBulkToolSelection] = useState([]);
  const [hoveredPointIndex, setHoveredPointIndex] = useState(null);

  const [gridName, setGridName] = useState("My Grid Template");
  const [gridDescription, setGridDescription] = useState("Template with GPS waypoints.");

  const TOOL_COLOR_MAP = {
    1: "green",   // Penetrometer
    2: "orange",  // Acoustic Sensor
  };

  const SVG_W = 600, SVG_H = 400, M = 20;

  /* ---- Autocomplete ---- */
  useEffect(() => {
    if (!searchQuery.trim()) return setSuggestions([]);
    const tid = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`
        );
        const js = await res.json();
        setSuggestions(js.map(s => ({ value: s.display_name, data: s })));
      } catch {}
    }, 500);
    return () => clearTimeout(tid);
  }, [searchQuery]);

  const pickSuggestion = (value, option) => {
    const s = option.data;
    setSearchQuery(s.display_name);
    setSuggestions([]);
    const lat = +s.lat, lng = +s.lon;
    setLocationCoords([lat,lng]);
    mapInstance?.setView([lat,lng],14);
  };

  /* ---- File upload for boundary ---- */
  const handleFileUpload = (info) => {
    const file = info.file.originFileObj || info.file;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const js = JSON.parse(e.target.result);
        if (js.type==="FeatureCollection" && js.features.length>=3) {
          const corners = js.features.map(feat => {
            const [lng,lat] = feat.geometry.coordinates;
            return {lat,lng};
          });
          setCornerCoords(corners);
          setManualPts([]);
          setGridPoints([]);
          message.success("Boundary loaded successfully!");
        } else {
          message.error("GeoJSON needs ≥3 points");
        }
      } catch {
        message.error("Invalid GeoJSON file");
      }
    };
    reader.readAsText(file);
    return false; // Prevent upload
  };

  /* ---- Manual boundary pick ---- */
  const onMapClickForBoundary = latlng => {
    if (!isSelectingBoundary) return;
    setManualPts(m=>[...m,{lat:latlng.lat,lng:latlng.lng}]);
  };
  
  const commitManualBoundary = () => {
    if (manualPts.length<3) {
      message.warning("Pick at least 3 points");
      return;
    }
    setCornerCoords(manualPts);
    setManualPts([]);
    setIsSelectingBoundary(false);
    setGridPoints([]);
    message.success("Boundary set successfully!");
  };
  
  const resetEverything = () => {
    setCornerCoords([]);
    setManualPts([]);
    setGridPoints([]);
    setSelectedPoint(null);
    setIsSelectingBoundary(false);
    setIsDefiningArea(false);
    setAreaSelIndices([]);
  };

  /* ---- Grid generation ---- */
  const generateGrid = () => {
    if (cornerCoords.length!==4) {
      message.error("Need exactly 4 corners");
      return;
    }
    const order = [];
    for (let k=0;k<4;k++){
      const idx =
        traversal==="CW"
          ? (startCorner+k)%4
          : (startCorner-k+4)%4;
      order.push(cornerCoords[idx]);
    }
    const [C0,C1,C2,C3] = order;
    const pts = [];
    for (let row=1; row<=gridSizeY; row++){
      const tRow = row/(gridSizeY+1);
      const left  = lerp(C0, C3, tRow);
      const right = lerp(C1, C2, tRow);
      const cols = [...Array(gridSizeX).keys()].map(i => i+1);
      if (row%2===0) cols.reverse();
      for (let col of cols){
        const tCol = col/(gridSizeX+1);
        pts.push({...lerp(left, right, tCol), custom:false});
      }
    }
    setGridPoints(pts);
    setSelectedPoint(null);
    message.success(`Generated ${pts.length} grid points`);
  };

  /* ---- Export helpers ---- */
  const makeStructuredJSON = (pts) => {
    if (!pts.length) return null;
    return {
      name: filename.trim(),
      description: gridDescription || "",
      backImage: "",
      configuration: {
        type: "gps",
        waypoints: pts.map((p, i) => ({
          id: i + 1,
          type: "gps",
          order: i + 1,
          coordinates: {
            latitude: +p.lat.toFixed(6),
            longitude: +p.lng.toFixed(6),
            altitude: 0
          },
          tool_type_id: toolAssignments[i] || []
        }))
      },
      areaId: 7,
      surfaceId: 7
    };
  };

  const exportStructuredJSON = () => {
    if (!gridPoints.length) {
      message.warning("No points to export!");
      return;
    }
    const jsonData = makeStructuredJSON(gridPoints);
    const blob = new Blob([JSON.stringify(jsonData, null, 2)], {
      type: "application/json"
    });
    saveAs(blob, (filename.trim() || "waypoints") + ".json");
    message.success("JSON exported successfully!");
  };

  /* ---- SVG transforms ---- */
  const latLngToSvg = (lat, lng) => {
    const src = cornerCoords.length ? cornerCoords : manualPts;
    if (!src.length) return null;
    const lats = src.map(p => p.lat);
    const lngs = src.map(p => p.lng);
    const minLat = Math.min(...lats), maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
    const x = M + ((lng - minLng) / (maxLng - minLng)) * (SVG_W - 2 * M);
    const y = M + ((maxLat - lat) / (maxLat - minLat)) * (SVG_H - 2 * M);
    return { x, y };
  };

  /* ---- Point handlers ---- */
  const onSvgClick = e => {
    if (mode!=="ADD") return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ox = e.clientX-rect.left, oy=e.clientY-rect.top;
    const src = cornerCoords.length? cornerCoords : manualPts;
    if (!src.length) return;
    const lats=src.map(p=>p.lat), lngs=src.map(p=>p.lng);
    const minLa=Math.min(...lats), maxLa=Math.max(...lats),
          minLo=Math.min(...lngs), maxLo=Math.max(...lngs);
    const nx=(ox-M)/(SVG_W-2*M), ny=1-(oy-M)/(SVG_H-2*M);
    const lng = minLo + nx*(maxLo-minLo);
    const lat = minLa + ny*(maxLa-minLa);
    setGridPoints(g=>[...g,{lat,lng,custom:true}]);
  };

  const onPointClick = (e, i) => {
    e.stopPropagation();
    if (taggingMode) {
      setSelectedTagPointIndex(i);
      setSelectedPoint(gridPoints[i]);
      setToolSelection(toolAssignments[i] || []);
      return;
    }
    if (mode === "DELETE") {
      setGridPoints(g => g.filter((_, idx) => idx !== i));
      setSelectedPoint(null);
    } else {
      setSelectedPoint(gridPoints[i]);
    }
  };

  return (
    <div>
      <Title level={3}>Interactive Grid Generator</Title>
      
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={8}>
          {/* Boundary Setup */}
          <Card title="📍 Boundary Setup" size="small">
            <Form layout="vertical">
              <Form.Item label="Boundary Method">
                <Radio.Group 
                  value={boundaryMethod}
                  onChange={e => {
                    setBoundaryMethod(e.target.value);
                    resetEverything();
                    if (e.target.value==="manual") setIsSelectingBoundary(true);
                  }}
                >
                  <Radio value="file">File Upload</Radio>
                  <Radio value="manual">Manual Selection</Radio>
                </Radio.Group>
              </Form.Item>

              {boundaryMethod === "file" && (
                <Form.Item label="Import GeoJSON">
                  <Upload
                    accept=".geojson"
                    beforeUpload={handleFileUpload}
                    showUploadList={false}
                  >
                    <Button 
                      icon={<UploadOutlined />}
                      style={{
                        ...brandConfig.buttonStyle,
                        color: brandConfig.colors.primary,
                        borderColor: brandConfig.colors.primary
                      }}
                    >
                      Select GeoJSON File
                    </Button>
                  </Upload>
                </Form.Item>
              )}

              {boundaryMethod === "manual" && (
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Form.Item label="Location Search">
                    <AutoComplete
                      options={suggestions}
                      onSelect={pickSuggestion}
                      onSearch={setSearchQuery}
                      placeholder="Search location..."
                    >
                      <Input
                        suffix={<SearchOutlined />}
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                      />
                    </AutoComplete>
                  </Form.Item>
                  
                  <Space>
                    <Button 
                      type={isSelectingBoundary ? "primary" : "default"}
                      onClick={() => setIsSelectingBoundary(b => !b)}
                      style={
                        isSelectingBoundary 
                          ? {
                              ...brandConfig.buttonStyle,
                              backgroundColor: brandConfig.colors.primary,
                              borderColor: brandConfig.colors.primary
                            }
                          : {
                              ...brandConfig.buttonStyle,
                              color: brandConfig.colors.primary,
                              borderColor: brandConfig.colors.primary
                            }
                      }
                    >
                      {isSelectingBoundary ? "Stop Selecting" : "Start Selecting"}
                    </Button>
                    <Button 
                      onClick={commitManualBoundary} 
                      disabled={manualPts.length < 3}
                      style={
                        manualPts.length < 3
                          ? brandConfig.disabledButtonStyle
                          : {
                              ...brandConfig.buttonStyle,
                              color: brandConfig.colors.primary,
                              borderColor: brandConfig.colors.primary
                            }
                      }
                    >
                      Set Boundary
                    </Button>
                  </Space>
                  
                  {manualPts.length > 0 && (
                    <Text type="secondary">
                      {manualPts.length} point{manualPts.length > 1 ? "s" : ""} selected
                    </Text>
                  )}
                </Space>
              )}
            </Form>
          </Card>

          {/* Grid Parameters */}
          <Card title="⚙️ Grid Parameters" size="small" style={{ marginTop: 16 }}>
            <Form layout="vertical">
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Grid X">
                    <InputNumber
                      min={1}
                      value={gridSizeX}
                      onChange={setGridSizeX}
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Grid Y">
                    <InputNumber
                      min={1}
                      value={gridSizeY}
                      onChange={setGridSizeY}
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                </Col>
              </Row>

              {cornerCoords.length === 4 && (
                <>
                  <Form.Item label="Start Corner">
                    <Select value={startCorner} onChange={setStartCorner}>
                      {cornerCoords.map((_, i) => (
                        <Option key={i} value={i}>
                          Corner {indexToLabel(i)}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>

                  <Form.Item label="Direction">
                    <Select value={traversal} onChange={setTraversal}>
                      <Option value="CW">Clockwise</Option>
                      <Option value="CCW">Counter-clockwise</Option>
                    </Select>
                  </Form.Item>
                </>
              )}

              <Button 
                type="primary" 
                onClick={generateGrid}
                icon={<EnvironmentOutlined />}
                block
                style={{
                  ...brandConfig.buttonStyle,
                  backgroundColor: brandConfig.colors.primary,
                  borderColor: brandConfig.colors.primary
                }}
              >
                Generate Grid
              </Button>
            </Form>
          </Card>

          {/* Sensor Tagging */}
          <Card title="🔧 Sensor Configuration" size="small" style={{ marginTop: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button
                type={taggingMode ? "primary" : "default"}
                onClick={() => {
                  setTaggingMode(m => {
                    const newVal = !m;
                    if (!newVal) {
                      setSelectedTagPointIndex(null);
                      setToolSelection([]);
                      setSelectedPoint(null);
                    }
                    return newVal;
                  });
                }}
                block
                style={
                  taggingMode 
                    ? {
                        ...brandConfig.buttonStyle,
                        backgroundColor: brandConfig.colors.primary,
                        borderColor: brandConfig.colors.primary
                      }
                    : {
                        ...brandConfig.buttonStyle,
                        color: brandConfig.colors.primary,
                        borderColor: brandConfig.colors.primary
                      }
                }
              >
                {taggingMode ? "Exit Tagging Mode" : "Enter Tagging Mode"}
              </Button>

              {taggingMode && (
                <>
                  <Text strong>
                    {selectedTagPointIndex !== null
                      ? `Selected Point #${selectedTagPointIndex + 1}`
                      : "No point selected"}
                  </Text>

                  <Form.Item label="Assign Tools">
                    <Checkbox.Group
                      options={[
                        { label: 'Penetrometer', value: 1 },
                        { label: 'Acoustic Sensor', value: 2 }
                      ]}
                      value={toolSelection}
                      onChange={setToolSelection}
                    />
                  </Form.Item>

                  <Space>
                    <Button
                      onClick={() => {
                        if (selectedTagPointIndex !== null) {
                          setToolAssignments(prev => ({
                            ...prev,
                            [selectedTagPointIndex]: toolSelection,
                          }));
                          setSelectedTagPointIndex(null);
                          setToolSelection([]);
                          message.success("Tools saved for point");
                        }
                      }}
                      disabled={selectedTagPointIndex === null}
                      style={
                        selectedTagPointIndex === null
                          ? brandConfig.disabledButtonStyle
                          : {
                              ...brandConfig.buttonStyle,
                              color: brandConfig.colors.primary,
                              borderColor: brandConfig.colors.primary
                            }
                      }
                    >
                      Save Tools
                    </Button>

                    <Button
                      onClick={() => {
                        const newAssignments = {};
                        gridPoints.forEach((_, i) => {
                          newAssignments[i] = [...toolSelection];
                        });
                        setToolAssignments(newAssignments);
                        message.success("Tools applied to all points");
                      }}
                      disabled={gridPoints.length === 0}
                      style={
                        gridPoints.length === 0
                          ? brandConfig.disabledButtonStyle
                          : {
                              ...brandConfig.buttonStyle,
                              color: brandConfig.colors.primary,
                              borderColor: brandConfig.colors.primary
                            }
                      }
                    >
                      Apply to All
                    </Button>
                  </Space>
                </>
              )}
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={16}>
          {/* Controls & Export */}
          <Card 
            title="🎛️ Grid Controls"
            extra={
              <Space>
                <Text>Points: {gridPoints.length}</Text>
                <Button 
                  icon={<ReloadOutlined />} 
                  onClick={resetEverything}
                  danger
                  style={{
                    ...brandConfig.buttonStyle,
                    backgroundColor: brandConfig.colors.status.error,
                    borderColor: brandConfig.colors.status.error,
                    color: brandConfig.colors.text.light
                  }}
                >
                  Reset
                </Button>
              </Space>
            }
          >
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
              <Col>
                <Space>
                  <Button 
                    type={mode === "NONE" ? "primary" : "default"}
                    onClick={() => setMode("NONE")}
                    style={
                      mode === "NONE" 
                        ? {
                            ...brandConfig.buttonStyle,
                            backgroundColor: brandConfig.colors.primary,
                            borderColor: brandConfig.colors.primary
                          }
                        : {
                            ...brandConfig.buttonStyle,
                            color: brandConfig.colors.primary,
                            borderColor: brandConfig.colors.primary
                          }
                    }
                  >
                    Select Mode
                  </Button>
                  <Button 
                    type={mode === "ADD" ? "primary" : "default"}
                    onClick={() => setMode("ADD")}
                    icon={<PlusOutlined />}
                    style={
                      mode === "ADD" 
                        ? {
                            ...brandConfig.buttonStyle,
                            backgroundColor: brandConfig.colors.primary,
                            borderColor: brandConfig.colors.primary
                          }
                        : {
                            ...brandConfig.buttonStyle,
                            color: brandConfig.colors.primary,
                            borderColor: brandConfig.colors.primary
                          }
                    }
                  >
                    Add Point
                  </Button>
                  <Button 
                    type={mode === "DELETE" ? "primary" : "default"}
                    onClick={() => setMode("DELETE")}
                    icon={<MinusOutlined />}
                    danger
                    style={
                      mode === "DELETE" 
                        ? {
                            ...brandConfig.buttonStyle,
                            backgroundColor: brandConfig.colors.status.error,
                            borderColor: brandConfig.colors.status.error
                          }
                        : {
                            ...brandConfig.buttonStyle,
                            color: brandConfig.colors.status.error,
                            borderColor: brandConfig.colors.status.error
                          }
                    }
                  >
                    Delete Point
                  </Button>
                  <Button 
                    onClick={() => {
                      setGridPoints([]);
                      setSelectedPoint(null);
                    }}
                    icon={<ClearOutlined />}
                    style={{
                      ...brandConfig.buttonStyle,
                      color: brandConfig.colors.primary,
                      borderColor: brandConfig.colors.primary
                    }}
                  >
                    Clear Points
                  </Button>
                </Space>
              </Col>
              
              <Col>
                <Space>
                  <Input
                    placeholder="Filename"
                    value={filename}
                    onChange={e => setFilename(e.target.value)}
                    style={{ width: 120 }}
                  />
                  <Button 
                    onClick={exportStructuredJSON}
                    icon={<DownloadOutlined />}
                    type="primary"
                    style={{
                      ...brandConfig.buttonStyle,
                      backgroundColor: brandConfig.colors.primary,
                      borderColor: brandConfig.colors.primary
                    }}
                  >
                    Export JSON
                  </Button>
                </Space>
              </Col>
            </Row>

            {/* Grid Preview SVG */}
            <div style={{ marginBottom: 16 }}>
              <Title level={5}>Grid Preview</Title>
              <svg
                width={SVG_W}
                height={SVG_H}
                style={{
                  border: "1px solid #d9d9d9",
                  background: "#fafafa",
                  cursor: mode === "ADD" ? "crosshair" : "default",
                  borderRadius: 4
                }}
                onClick={onSvgClick}
              >
                {/* boundary polygon */}
                {cornerCoords.length >= 3 && (
                  <polyline
                    points={
                      cornerCoords
                        .map((p) => {
                          const { x, y } = latLngToSvg(p.lat, p.lng);
                          return `${x},${y}`;
                        })
                        .join(" ") +
                      " " +
                      (() => {
                        const { x, y } = latLngToSvg(
                          cornerCoords[0].lat,
                          cornerCoords[0].lng
                        );
                        return `${x},${y}`;
                      })()
                    }
                    fill="none"
                    stroke="#1890ff"
                    strokeWidth="2"
                  />
                )}

                {/* corners */}
                {cornerCoords.map((c, i) => {
                  const { x, y } = latLngToSvg(c.lat, c.lng);
                  return (
                    <g key={i}>
                      <circle cx={x} cy={y} r={6} fill="#1890ff" stroke="#fff" strokeWidth="2" />
                      <text x={x + 8} y={y - 4} fontSize="12px" fill="#1890ff" fontWeight="bold">
                        {indexToLabel(i)}
                      </text>
                    </g>
                  );
                })}

                {/* grid points */}
                {gridPoints.map((pt, i) => {
                  const { x, y } = latLngToSvg(pt.lat, pt.lng);
                  const isSelected = taggingMode && selectedTagPointIndex === i;

                  return (
                    <g key={i}>
                      {toolAssignments[i]?.map((toolId, j) => (
                        <circle
                          key={toolId}
                          cx={x}
                          cy={y}
                          r={10 + j * 2}
                          fill="none"
                          stroke={TOOL_COLOR_MAP[toolId] || "purple"}
                          strokeWidth="2"
                        />
                      ))}

                      {isSelected && (
                        <circle
                          cx={x}
                          cy={y}
                          r={12}
                          fill="none"
                          stroke="#1890ff"
                          strokeWidth="2"
                          strokeDasharray="3 2"
                        />
                      )}

                      <circle
                        cx={x}
                        cy={y}
                        r={pt.custom ? 6 : 4}
                        fill={pt.custom ? "#fa8c16" : "#52c41a"}
                        onClick={(e) => onPointClick(e, i)}
                        style={{
                          cursor: taggingMode || mode === "DELETE" ? "pointer" : "default",
                        }}
                      />

                      <text x={x + 5} y={y - 5} fontSize="10px" fill="#001529" fontWeight="bold">
                        {i + 1}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Map Preview */}
            <div>
              <Title level={5}>Satellite Map Preview</Title>
              <div style={{ border: "1px solid #d9d9d9", borderRadius: 4 }}>
                <MapContainer
                  center={[0,0]}
                  zoom={2}
                  whenCreated={setMapInstance}
                  style={{width: '100%', height: SVG_H}}
                >
                  <ZoomToBounds boundary={cornerCoords} gridPoints={gridPoints} />
                  <TileLayer
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    attribution="&copy; Esri"
                  />

                  {/* boundary polyline */}
                  {cornerCoords.length>=3 && (
                    <Polyline
                      positions={[
                        ...cornerCoords.map(p=>[p.lat,p.lng]),
                        [cornerCoords[0].lat,cornerCoords[0].lng],
                      ]}
                      color="#1890ff"
                      weight={3}
                    />
                  )}

                  {/* grid markers */}
                  {gridPoints.map((pt,i)=> (
                    <Marker
                      key={i}
                      position={[pt.lat,pt.lng]}
                      eventHandlers={{ click: e=>onPointClick(e,i) }}
                    >
                      <Popup>
                        <b>Point #{i+1}</b><br/>
                        <b>Lat:</b> {pt.lat.toFixed(6)}<br/>
                        <b>Lng:</b> {pt.lng.toFixed(6)}<br/>
                        {toolAssignments[i]?.length > 0 && (
                          <>
                            <b>Tools:</b> {toolAssignments[i].join(', ')}<br/>
                          </>
                        )}
                      </Popup>
                    </Marker>
                  ))}

                  {/* manual boundary picks */}
                  {boundaryMethod==="manual" &&
                    manualPts.map((pt,i)=>(
                      <CircleMarker
                        key={i}
                        center={[pt.lat,pt.lng]}
                        radius={8}
                        color="#52c41a"
                        fillOpacity={0.8}
                      />
                    ))
                  }

                  {boundaryMethod==="manual" && (
                    <ManualBoundaryHandler
                      isActive={isSelectingBoundary}
                      onSelect={onMapClickForBoundary}
                    />
                  )}

                  <RecenterOnLocation coords={locationCoords}/>
                </MapContainer>
              </div>
            </div>

            {/* Selected Point Info */}
            <div style={{ marginTop: 16, padding: 12, background: '#f9f9f9', borderRadius: 4 }}>
              {selectedPoint ? (
                <Text>
                  <b>Selected:</b> Lat {selectedPoint.lat.toFixed(6)}, Lng {selectedPoint.lng.toFixed(6)}
                </Text>
              ) : (
                <Text type="secondary">No point selected</Text>
              )}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
