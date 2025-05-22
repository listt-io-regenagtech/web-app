import React, { useState, useEffect } from "react";
import { saveAs } from "file-saver";
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

/* ------------- Main Component ------------- */
export default function GridGenerator() {
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
  const [toolSelection, setToolSelection] = useState([]);         // For selected point
  const [bulkToolSelection, setBulkToolSelection] = useState([]); // For apply-to-all
  const [hoveredPointIndex, setHoveredPointIndex] = useState(null);

  const [gridName, setGridName] = useState("My Grid Template");
  const [gridDescription, setGridDescription] = useState("Template with GPS waypoints.");

  const TOOL_COLOR_MAP = {
    1: "green",   // Penetrometer
    2: "orange",  // Acoustic Sensor
    // Add more as needed
  };

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
    if (!gridPoints.length) return alert("No points!");
    const jsonData = makeStructuredJSON(gridPoints);
    const blob = new Blob([JSON.stringify(jsonData, null, 2)], {
      type: "application/json"
    });
    saveAs(blob, (filename.trim() || "waypoints") + ".json");
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
        setSuggestions(js);
      } catch {}
    }, 500);
    return () => clearTimeout(tid);
  }, [searchQuery]);

  const pickSuggestion = s => {
    setSearchQuery(s.display_name);
    setSuggestions([]);
    const lat = +s.lat, lng = +s.lon;
    setLocationCoords([lat,lng]);
    mapInstance?.setView([lat,lng],14);
  };

  /* ---- Location handlers ---- */
  const handleLocationSearch = async () => {
    if (!searchQuery||!mapInstance) return;
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`
      );
      const js = await res.json();
      if (js.length) {
        const lat = +js[0].lat, lng = +js[0].lon;
        setLocationCoords([lat,lng]);
        mapInstance.setView([lat,lng],14);
      }
    } catch {}
  };
  const refreshMap = () => {
    if (mapInstance && locationCoords) mapInstance.setView(locationCoords,14);
    else alert("Map or location not ready");
  };

  /* ---- File upload for boundary ---- */
  const handleFileUpload = e => {
    const f = e.target.files[0]; if (!f) return;
    const rdr = new FileReader();
    rdr.onload = evt => {
      try {
        const js = JSON.parse(evt.target.result);
        if (js.type==="FeatureCollection" && js.features.length>=3) {
          const corners = js.features.map(feat => {
            const [lng,lat] = feat.geometry.coordinates;
            return {lat,lng};
          });
          setCornerCoords(corners);
          setManualPts([]);
          setGridPoints([]);
        } else {
          alert("GeoJSON needs ≥3 points");
        }
      } catch {
        alert("Invalid GeoJSON");
      }
    };
    rdr.readAsText(f);
  };

  /* ---- Manual boundary pick ---- */
  const onMapClickForBoundary = latlng => {
    if (!isSelectingBoundary) return;
    setManualPts(m=>[...m,{lat:latlng.lat,lng:latlng.lng}]);
  };
  const commitManualBoundary = () => {
    if (manualPts.length<3) {
      alert("Pick at least 3 points");
      return;
    }
    setCornerCoords(manualPts);
    setManualPts([]);
    setIsSelectingBoundary(false);
    setGridPoints([]);
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

  /* ---- Grid generation with bilinear & S pattern ---- */
  const generateGrid = () => {
    if (cornerCoords.length!==4) {
      alert("Need exactly 4 corners");
      return;
    }
    // reorder corners A→... by startCorner & traversal
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
      // build column indices in zig-zag
      const cols = [...Array(gridSizeX).keys()].map(i => i+1);
      if (row%2===0) cols.reverse();
      for (let col of cols){
        const tCol = col/(gridSizeX+1);
        pts.push({...lerp(left, right, tCol), custom:false});
      }
    }
    setGridPoints(pts);
    setSelectedPoint(null);
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



  /* ---- SVG click to add custom ---- */
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

  if (isDefiningArea) {
    // assign A→B→C→D in order
    if (areaSelIndices.includes(i)) return;
    const next = areaSelIndices.length;
    if (next < 4) {
      const updated = [...areaSelIndices, i];
      setAreaSelIndices(updated);
      if (updated.length === 4) {
        const corners = updated.map(idx => gridPoints[idx]);
        setCornerCoords(corners);
        setIsDefiningArea(false);
        setAreaSelIndices([]);
        setGridPoints([]);
        setSelectedPoint(null);
      }
    }
    return;
  }

  if (mode === "DELETE") {
    setGridPoints(g => g.filter((_, idx) => idx !== i));
    setSelectedPoint(null);
  } else {
    setSelectedPoint(gridPoints[i]);
  }
};


  /* ---- Export helpers ---- */
  const makeGeoJSON = pts => ({
    type:"FeatureCollection",
    features:pts.map(p=>({
      type:"Feature",
      geometry:{type:"Point",coordinates:[p.lng,p.lat]},
      properties:{}
    }))
  });
  const makeCSV = pts => {
    let s="latitude,longitude\n";
    pts.forEach(p=>s+=`${p.lat},${p.lng}\n`);
    return s;
  };
  const exportGeoJSON = ()=>{
    if (!gridPoints.length) return alert("No points!");
    const name = filename.trim()||"grid";
    const blob = new Blob(
      [JSON.stringify(makeGeoJSON(gridPoints),null,2)],
      {type:"application/json"}
    );
    saveAs(blob, name.endsWith(".geojson")?name:name+".geojson");
  };
  const exportCSV = ()=>{
    if (!gridPoints.length) return alert("No points!");
    const name = filename.trim()||"grid";
    const blob = new Blob(
      [makeCSV(gridPoints)],
      {type:"text/csv;charset=utf-8"}
    );
    saveAs(blob, name.endsWith(".csv")?name:name+".csv");
  };

  return (
    <div >
      <h1>Interactive Grid Generator</h1>

      {/* Boundary method */}
      <div style={{marginBottom:"1rem"}}>
        <strong>Boundary Method:</strong>{" "}
        <select value={boundaryMethod}
          onChange={e=>{
            setBoundaryMethod(e.target.value);
            resetEverything();
            if (e.target.value==="manual") setIsSelectingBoundary(true);
          }}
        >
          <option value="file">File Upload</option>
          <option value="manual">Manual Selection</option>
        </select>
      </div>

      {/* File upload */}
      {boundaryMethod==="file" && (
        <div style={{marginBottom:"1rem"}}>
          <label>Import GeoJSON:</label>{" "}
          <input type="file" accept=".geojson" onChange={handleFileUpload}/>
        </div>
      )}

      {/* Manual pick UI */}
{boundaryMethod === "manual" && (
  <div style={{
    marginBottom: "1rem",
    border: "1px solid #ccc",
    padding: "0.5rem"
  }}>
    <h3 style={{ margin: "0 0 0.2rem 0" }}>Manual Boundary</h3>
    <div style={{
      marginBottom: "0.5rem",
      fontSize: "0.9rem",
      color: "#555",
      fontStyle: "italic"
    }}>
      Please select boundary points in a <strong>clockwise</strong> direction.
    </div>

    <div style={{ position: "relative" }}>
      <input
        style={{ width: "70%" }}
        placeholder="Search location..."
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
      />
            <button onClick={handleLocationSearch}>Search</button>{" "}
            <button onClick={refreshMap}>Refresh Map</button>
            {suggestions.length>0 && (
              <ul style={{
                position:"absolute", top:"2rem", left:0,
                background:"#fff", border:"1px solid #ccc",
                maxHeight:"150px", overflowY:"auto",
                margin:0,padding:0,listStyle:"none",zIndex:999
              }}>
                {suggestions.map(s=>(
                  <li key={s.place_id}
                    style={{
                      padding:"0.5rem",cursor:"pointer",
                      borderBottom:"1px solid #eee"
                    }}
                    onClick={()=>pickSuggestion(s)}
                  >
                    {s.display_name}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div style={{marginTop:"0.5rem"}}>
            <button onClick={()=>setIsSelectingBoundary(b=>!b)}>
              {isSelectingBoundary ? "Stop Selecting" : "Start Selecting"}
            </button>{" "}
            <button onClick={commitManualBoundary} disabled={manualPts.length < 3}>
            Set as Boundary
          </button>{" "}
          <button onClick={resetEverything} style={{ marginLeft: "0.5rem" }}>
            Reset Everything
          </button>{" "}
            {manualPts.length>0 && (
              <em>{manualPts.length} point{manualPts.length>1?"s":""} picked</em>
            )}
          </div>
        </div>
      )}

      {/* Parameters: X, Y, start corner, direction */}
      <div style={{marginBottom:"1rem"}}>
        <label>X:</label>{" "}
        <input
          type="number" min="1"
          value={gridSizeX}
          onChange={e=>setGridSizeX(+e.target.value)}
        />{" "}
        <label>Y:</label>{" "}
        <input
          type="number" min="1"
          value={gridSizeY}
          onChange={e=>setGridSizeY(+e.target.value)}
        />{" "}
        {cornerCoords.length===4 && (
          <>
            <label>Start Corner:</label>{" "}
            <select
              value={startCorner}
              onChange={e=>setStartCorner(+e.target.value)}
            >
              {cornerCoords.map((_,i)=>(
                <option key={i} value={i}>
                  {indexToLabel(i)}
                </option>
              ))}
            </select>{" "}
            <label>Direction:</label>{" "}
            <select
              value={traversal}
              onChange={e=>setTraversal(e.target.value)}
            >
              <option value="CW">Clockwise</option>
              <option value="CCW">Counter‐clockwise</option>
            </select>
          </>
        )}
        <button onClick={generateGrid} style={{marginLeft:"1rem"}}>
          Generate Grid
        </button>
      </div>

      {/* Modes + Define Area */}
      <div style={{ marginBottom: "1rem" }}>
          <button onClick={() => setMode("NONE")}>No Mode</button>{" "}
          <button onClick={() => setMode("ADD")}>Add Point</button>{" "}
          <button onClick={() => setMode("DELETE")}>Delete Point</button>{" "}
          <button
            onClick={() => {
              setGridPoints([]);
              setSelectedPoint(null);
            }}
          > 
          Clear Points
          </button>{" "}
          
          <strong>Mode:</strong> {mode}
          {" "}
          <span style={{ marginLeft: "2rem" }}>
            <input
              placeholder="Filename"
              value={filename}
              onChange={e => setFilename(e.target.value)}
              style={{ width: "140px", marginRight: "0.5rem" }}
            />
            <button onClick={exportStructuredJSON}>Structured JSON</button>
            <button onClick={exportGeoJSON}>GeoJSON</button>{" "}
            <button onClick={exportCSV}>CSV</button>
          </span>
        </div>

      {/* Previews */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
  {/* === LEFT COLUMN: Sensor Tagging Panel === */}
<div style={{ width: "280px", border: "1px solid #ccc", padding: "0.75rem" }}>
  <h3>Sensor Tagging</h3>

  <button
    onClick={() => {
      setTaggingMode((m) => {
  const newVal = !m;
  if (!newVal) {
    setSelectedTagPointIndex(null);
    setToolSelection([]);
    setSelectedPoint(null); // <-- this resets the Selected Point label
  }
  return newVal;
});

    }}
    style={{
      background: taggingMode ? "#eef" : "",
      padding: "0.3rem 0.75rem",
      marginBottom: "0.75rem",
      width: "100%",
    }}
  >
    {taggingMode ? "Exit Tagging Mode" : "Enter Tagging Mode"}
  </button>

  {taggingMode && (
  <>
    <div style={{ marginBottom: "0.25rem" }}>
      <b>
        {selectedTagPointIndex !== null
          ? `Selected Point #${selectedTagPointIndex + 1}`
          : "No point selected"}
      </b>
    </div>

    <div style={{ marginBottom: "0.5rem" }}>
      <label>Assign Tools:</label>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        <label>
          <input
            type="checkbox"
            value={1}
            checked={toolSelection.includes(1)}
            onChange={(e) => {
              const checked = e.target.checked;
              setToolSelection((prev) =>
                checked ? [...prev, 1] : prev.filter((v) => v !== 1)
              );
            }}
          />
          Penetrometer
        </label>
        <label>
          <input
            type="checkbox"
            value={2}
            checked={toolSelection.includes(2)}
            onChange={(e) => {
              const checked = e.target.checked;
              setToolSelection((prev) =>
                checked ? [...prev, 2] : prev.filter((v) => v !== 2)
              );
            }}
          />
          Acoustic Sensor
        </label>
      </div>
    </div>

    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <button
        onClick={() => {
          if (selectedTagPointIndex !== null) {
            setToolAssignments((prev) => ({
              ...prev,
              [selectedTagPointIndex]: toolSelection,
            }));
            setSelectedTagPointIndex(null);
            setToolSelection([]);
          }
        }}
        disabled={selectedTagPointIndex === null}
      >
        Save Tools
      </button>

      <button
        onClick={() => {
          const newAssignments = {};
          gridPoints.forEach((_, i) => {
            newAssignments[i] = [...toolSelection];
          });
          setToolAssignments(newAssignments);
        }}
        disabled={gridPoints.length === 0}
      >
        Apply to All
      </button>

      <button
        onClick={() => {
          const cleared = {};
          gridPoints.forEach((_, i) => {
            cleared[i] = [];
          });
          setToolAssignments(cleared);
        }}
        disabled={gridPoints.length === 0}
      >
        Clear All
      </button>
    </div>
  </>
)}

</div>

  {/* === RIGHT COLUMN: Previews === */}
  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
    {/* SVG preview */}
    <div>
      <h3>Grid Preview</h3>
      <svg
  width={SVG_W}
  height={SVG_H}
  style={{
    border: "1px solid #999",
    background: "#fafafa",
    cursor: mode === "ADD" ? "crosshair" : "default",
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
      stroke="red"
      strokeWidth="2"
    />
  )}

  {/* corners */}
  {cornerCoords.map((c, i) => {
    const { x, y } = latLngToSvg(c.lat, c.lng);
    return (
      <g key={i}>
        <circle cx={x} cy={y} r={6} fill="red" stroke="#000" />
        <text x={x + 8} y={y - 4} fontSize="14px" fill="#000">
          {indexToLabel(i)}
        </text>
      </g>
    );
  })}

  {/* grid points with tool rings */}
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
            stroke="#00f"
            strokeWidth="2"
            strokeDasharray="3 2"
          />
        )}

        <circle
          cx={x}
          cy={y}
          r={
          (taggingMode || mode === "DELETE") && hoveredPointIndex === i
            ? pt.custom ? 10 : 8
            : pt.custom ? 6 : 4
        }

         fill={pt.custom ? "orange" : "black"}
          onClick={(e) => onPointClick(e, i)}
          onMouseEnter={() => (taggingMode || mode === "DELETE") && setHoveredPointIndex(i)}
          onMouseLeave={() => (taggingMode || mode === "DELETE") && setHoveredPointIndex(null)}
          style={{
            cursor: taggingMode || mode === "DELETE" ? "pointer" : "default",
            transition: "r 0.2s ease"
          }}
        />


        <text x={x + 5} y={y - 5} fontSize="12px" fill="blue">
          {i + 1}
        </text>
      </g>
    );
  })}

  {/* Selected ring */}
  {selectedPoint && (() => {
  const coords = latLngToSvg(selectedPoint.lat, selectedPoint.lng);
  return coords ? (
    <circle
      {...coords}
      r={10}
      stroke="blue"
      fill="none"
      strokeWidth="2"
    />
  ) : null;
})()}

</svg>

    </div>
  </div>
        {/* Leaflet map */}
        <div>
          <h3>Map Preview (Satellite)</h3>
          <MapContainer
            center={[0,0]}
            zoom={2}
            whenCreated={m=>setMapInstance(m)}
            style={{width:SVG_W, height:SVG_H}}
          >
            <ZoomToBounds
              boundary={cornerCoords}
              gridPoints={gridPoints}
            />
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
                color="red"
              />
            )}

            {/* grid markers */}
            {gridPoints.map((pt,i)=> {
              const isAreaPt = areaSelIndices.includes(i);
              const label = isAreaPt
                ? indexToLabel(areaSelIndices.indexOf(i))
                : null;
              return (
                <Marker
                  key={i}
                  position={[pt.lat,pt.lng]}
                  eventHandlers={{
                    click: e=>onPointClick(e,i),
                  }}
                >
                  <Popup>
                    <b>Lat:</b> {pt.lat.toFixed(6)}<br/>
                    <b>Lng:</b> {pt.lng.toFixed(6)}
                  </Popup>
                  {isAreaPt && (
                    <Tooltip permanent direction="top">
                      {label}
                    </Tooltip>
                  )}
                </Marker>
              );
            })}

            {/* manual boundary picks */}
            {boundaryMethod==="manual" &&
              manualPts.map((pt,i)=>(
                <CircleMarker
                  key={i}
                  center={[pt.lat,pt.lng]}
                  radius={8}
                  color="green"
                  fillOpacity={0.8}
                />
              ))
            }

            {/* map click for manual boundary */}
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

      <div style={{marginTop:"1rem"}}>
        {selectedPoint ? (
          <div>
            <b>Selected:</b> Lat {selectedPoint.lat.toFixed(6)}, Lng{" "}
            {selectedPoint.lng.toFixed(6)}
          </div>
        ) : (
          <div>No point selected</div>
        )}
      </div>
    </div>
  );
}
