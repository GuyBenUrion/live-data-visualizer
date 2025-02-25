import React, { useRef, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import Chart from 'chart.js/auto';
import streamingPlugin from 'chartjs-plugin-streaming';
import 'chartjs-adapter-luxon';

// Register the streaming plugin
Chart.register(streamingPlugin);

const RealTimeChart = () => {
  const chartRef = useRef(null);

  useEffect(() => {
    return () => {
      // Ensure that if the chart exists, it's properly destroyed on unmount.
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, []);

  const chartData = {
    datasets: [
      // ... your datasets definition here
    ]
  };

  const options = {
    scales: {
      x: {
        type: 'realtime',
        realtime: {
          duration: 30000,
          refresh: 1000,
          delay: 0,
          onRefresh: (chart) => {
            // Here, update the chart data if necessary.
          },
        },
        title: {
          display: true,
          text: 'Time'
        }
      },
      y: {
        min: 0,
        max: 21,
        title: {
          display: true,
          text: 'Value'
        }
      }
    },
    plugins: {
      legend: {
        display: true,
      }
    },
    maintainAspectRatio: false,
  };

  return (
    <div style={{ height: '400px' }}>
      <Line ref={chartRef} data={chartData} options={options} />
    </div>
  );
};

export default RealTimeChart;
