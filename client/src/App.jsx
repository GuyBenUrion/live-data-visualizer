import React, { useEffect, useState, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";

// TD: Change group size, data buffer, channels number dynamically
const GROUP_SIZE = 100;
const DATA_BUFFER_SIZE = 3000
const CHANNELS_NUMBER = 10;
const URL =`0.0.0.0:8080`
const WS_URL =`ws://${URL}`
const HTTP_URL =`http://${URL}`
const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#ff0000", "#00ff00", "#0000ff", "#ffff00", "#00ffff", "#ff00ff"];

const App = () => {
  const [samples, setSamples] = useState([]);
  const [progressValue, setProgressValue] = useState(0);
  const [displayAverage, setDisplayAverage] = useState(false);
  const [selectedChannels, setSelectedChannels] = useState(new Array(CHANNELS_NUMBER).fill(true));

  useEffect(() => {
  const ws = new WebSocket(`${WS_URL}/ws`);

    ws.onopen = () => {
      console.log("WebSocket connected");
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);

        switch (message.type) {
          case "sync":
            setSamples(message.data);
            break;
          case "append":
            setSamples(prevData => {
              const updated = [message.data, ...prevData];
              return updated.length > DATA_BUFFER_SIZE ? updated.slice(0, DATA_BUFFER_SIZE) : updated;
            });
            break;
          default:
            console.error("Unknown message type:", message.type);
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

  const calculateMovingAverage = data => { 
      const result = [];
      for (let i = GROUP_SIZE; i < data.length; i++) {
        const windowSamples = data.slice(Math.max(0, i - GROUP_SIZE + 1), i + 1);

        const sums = new Array(10).fill(0);
        windowSamples.forEach(sample => {
          sample.forEach((value, j) => {
            sums[j] += value;
          });
        });

        const averages = sums.map(sum => sum / windowSamples.length);
        const obj = { x: i };
        averages.forEach((avg, j) => {
          obj[`channel${j}`] = avg;
        });
        result.push(obj);
      }
      return result;
    }

  const formatDataForVisualization = data => data.map((sample, index) => {
    const obj = { x: index };
    sample.forEach((value, j) => {
      obj[`channel${j}`] = value;
    });
    return obj;
  })

  // Compute the chart data based on the current display mode.
  const chartData = useMemo(() => {
    if (!samples || samples.length === 0) return [];
    return displayAverage ? calculateMovingAverage(samples) : formatDataForVisualization(samples);

  }, [samples, displayAverage]);

  const handleChannelToggle = (index) => {
    setSelectedChannels(prev => {
      const newChannels = [...prev];
      newChannels[index] = !newChannels[index];
      return newChannels;
    });
  };

  const sendBroadcastInterval = async () => {
    try {
      const response = await fetch(`${HTTP_URL}/broadcast_interval`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interval: progressValue })
      });
      const data = await response.json();
      console.log("Broadcast interval updated:", data.broadcast_interval);
    } catch (error) {
      console.error("Error sending broadcast interval:", error);
    }
  };

  return (
    <div>
      <h1 style={{ display: "flex", justifyContent: "center" }}>Real Time Chart</h1>
      <div
        style={{
          marginTop: "1rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "1rem"
        }}
      >
  <button
    onClick={() => setDisplayAverage(prev => !prev)}
    style={{ padding: "0.5rem 1rem",  cursor: "pointer", fontSize: "1rem" }}
  >
    {displayAverage ? "Switch to Normal Graph" : "Switch to Moving Average Graph"}
  </button>

  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
    <label htmlFor="progressBar" style={{ fontWeight: "bold" }}>
      Set Broadcast Interval Timeout (m/s):
    </label>
    <input
      id="progressBar"
      type="range"
      min="0"
      max="500"
      value={progressValue}
      onChange={(e) => setProgressValue(Number(e.target.value))}
      style={{ marginRight: "0.5rem" }}
    />
    <span>{progressValue}</span>
    <button
      onClick={sendBroadcastInterval}
      style={{
        padding: "0.5rem 1rem",
        cursor: "pointer",
        fontSize: "1rem"
      }}
    >
      Set Timeout
    </button>
  </div>
</div>

      <div style={{ marginTop: "1rem", marginBottom: "1rem", display: "flex", justifyContent: "center" }}>
        {COLORS.map((color, i) => (
          <label key={i} style={{ marginRight: "1rem", marginBottom: "0.5rem", display: "flex", alignItems: "center" }}>
            <input
              type="checkbox"
              checked={selectedChannels[i]}
              onChange={() => handleChannelToggle(i)}
              style={{ marginRight: "0.5rem" }}
            />
            <span style={{ color }}>{`Channel ${i}`}</span>
          </label>
        ))}
      </div>

      {chartData.length > 0 ? (
        <LineChart
          width={2400}
          height={950}
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            domain={[0, 30]}
            dataKey="x"
            label={{
              value: displayAverage
                ? "Time (m/s) - Moving Average"
                : "Time (m/s)",
              position: "insideBottomRight",
              offset: -10
            }}
          />
          <YAxis
            label={{ value: "Value", angle: -90, position: "insideLeft" }}
            domain={[0, 20]}
          />
          {COLORS.map((color, i) => (
            selectedChannels[i] && (
              <Line
                key={i}
                dataKey={`channel${i}`}
                stroke={color}
                // Disable animations to prevent bouncing:
                isAnimationActive={false}
                // Use a smooth curve:
                type="monotone"
                dot={false}
              />
            )
          ))}
        </LineChart>

      ): null}
    </div>
  );
};

export default App;
