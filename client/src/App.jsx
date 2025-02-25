// src/App.jsx
import React, { useEffect, useState, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

const App = () => {
  // data will hold the incoming array of arrays from the WebSocket
  const [data, setData] = useState(null);
  // Toggle between displaying every sample (false) or per second (true)
  const [displayPerSecond, setDisplayPerSecond] = useState(false);
  // State to track which channels are selected (default: all true for 10 channels)
  const [selectedChannels, setSelectedChannels] = useState(
    new Array(10).fill(true)
  );

  useEffect(() => {
    const ws = new WebSocket("ws://127.0.0.1:8080/ws");

    ws.onopen = () => {
      console.log("WebSocket connected");
    };

    ws.onmessage = (event) => {
      try {
        const parsedData = JSON.parse(event.data);
        setData(parsedData);
      } catch (error) {
        console.error("Error parsing message data:", error);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    ws.onclose = () => {
      console.log("WebSocket connection closed");
    };

    return () => {
      ws.close();
    };
  }, []);

  // Define colors for each of the 10 channels
  const lineColors = [
    "#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#ff0000",
    "#00ff00", "#0000ff", "#ffff00", "#00ffff", "#ff00ff"
  ];

  // Transform data into a chart-friendly format
  const chartData = useMemo(() => {
    if (!data) return [];
    if (!displayPerSecond) {
      return data.map((sample, index) => {
        const obj = { x: index };
        sample.forEach((value, j) => {
          obj[`channel${j}`] = value;
        });
        return obj;
      });
    } else {
      // In per-second mode, select one sample per second (assuming 100 samples per second)
      const groupSize = 100;
      const result = [];
      for (let i = 0; i < data.length; i += groupSize) {
        const sample = data[i];
        const obj = { x: i / groupSize }; // x represents seconds.
        sample.forEach((value, j) => {
          obj[`channel${j}`] = value;
        });
        result.push(obj);
      }
      return result;
    }
  }, [data, displayPerSecond]);

  // Handler for toggling channel selection
  const handleChannelToggle = (index) => {
    setSelectedChannels((prev) => {
      const newChannels = [...prev];
      newChannels[index] = !newChannels[index];
      return newChannels;
    });
  };

  return (
    <div>
      <h1>Real Time Chart</h1>
      {data ? <p>Data length: {data.length}</p> : <p>No data</p>}
      
      <button onClick={() => setDisplayPerSecond(prev => !prev)}>
        {displayPerSecond ? "Switch to m/s display" : "Switch to per-second display"}
      </button>

      {/* Render channel selection checkboxes */}
      <div style={{ marginTop: "1rem", marginBottom: "1rem" }}>
        {lineColors.map((color, i) => (
          <label key={i} style={{ marginRight: "1rem" }}>
            <input
              type="checkbox"
              checked={selectedChannels[i]}
              onChange={() => handleChannelToggle(i)}
            />
            <span style={{ color: color, marginLeft: "0.25rem" }}>
              Channel {i}
            </span>
          </label>
        ))}
      </div>

      {chartData.length > 0 && (
        <LineChart
          width={2400}
          height={1000}
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="x"
            label={{
              value: displayPerSecond ? "Time (s)" : "Sample Index",
              position: "insideBottomRight",
              offset: -20
            }}
          />
          <YAxis label={{ value: "Value", angle: -90, position: "insideLeft" }} />
          {/* Render a separate line for each channel if it is selected */}
          {lineColors.map((color, i) => {
            return (
              selectedChannels[i] && (
                <Line
                  key={i}
                  dataKey={`channel${i}`}
                  stroke={color}
                  dot={false}
                />
              )
            );
          })}
        </LineChart>
      )}
    </div>
  );
};

export default App;
