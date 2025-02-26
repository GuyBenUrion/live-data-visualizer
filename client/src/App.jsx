import React, { useEffect, useState, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

const App = () => {
  const [data, setData] = useState([]);
  const [displayPerSecond, setDisplayPerSecond] = useState(false);
  const [selectedChannels, setSelectedChannels] = useState(new Array(10).fill(true));
  const colors = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#ff0000", "#00ff00", "#0000ff", "#ffff00", "#00ffff", "#ff00ff"]
  
  useEffect(() => {
    const ws = new WebSocket("ws://127.0.0.1:8080/ws");

    ws.onopen = () => {
      console.log("WebSocket connected");
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === "sync") {
          // Replace the current data with the full buffer from the server.
          setData(message.data);
        } else if (message.type === "append") {
          // Append the new sample and cap the state to 3000 items.
          setData(prevData => {
            const updated = [...prevData, message.data];
            return updated.length > 3000 ? updated.slice(updated.length - 3000) : updated;
          });
        }
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

  // Transform data for the chart.
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    if (!displayPerSecond) {
      // for desplaying per second, add every sample to the chart
      return data.map((sample, index) => {
        const obj = { x: index };
        sample.forEach((value, j) => {
          obj[`channel${j}`] = value;
        });
        return obj;
      });
    } else {
      // for displaying per second, take 1 sample every 100 samples. TD: make it work smouthly
      const groupSize = 100;
      const result = [];
      for (let i = 0; i < data.length; i += groupSize) {
        const sample = data[i];
        const obj = { x: i / groupSize };
        sample.forEach((value, j) => {
          obj[`channel${j}`] = value;
        });
        result.push(obj);
      }
      return result;
    }
  }, [data, displayPerSecond]);

  const handleChannelToggle = (index) => {
    setSelectedChannels((prev) => {
      const newChannels = [...prev];
      newChannels[index] = !newChannels[index];
      return newChannels;
    });
  };

  return (
    <div>
      <h1 style={{display: "flex", justifyContent:"center"}}>Real Time Chart</h1>
      {data.length ? <p>Data length: {data.length}</p> : <p>No data</p>}
      
      <button onClick={() => setDisplayPerSecond(prev => !prev)}>
        {displayPerSecond ? "Switch to m/s display" : "Switch to per-second display"}
      </button>

      <div style={{ marginTop: "1rem", marginBottom: "1rem", display: "flex", justifyContent: "center" }}>
        {colors.map((color, i) => (
          <label key={i} style={{ marginRight: "1rem", marginBottom: "0.5rem", display: "flex", alignItems: "center" }}>
            <input
              type="checkbox"
              checked={selectedChannels[i]}
              onChange={() => handleChannelToggle(i)}
              style={{ marginRight: "0.5rem" }}
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
          height={950}
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="x"
            label={{
              value: displayPerSecond ? "Time (s)" : "Time (m/s)",
              position: "insideBottomRight",
              offset: -10
            }}
          />
          <YAxis label={{ value: "Value", angle: -90, position: "insideLeft" }} />
          {colors.map((color, i) => (
            selectedChannels[i] && (
              <Line
                key={i}
                dataKey={`channel${i}`}
                stroke={color}
                dot={false}
              />
            )
          ))}
        </LineChart>
      )}
    </div>
  );
};

export default App;
