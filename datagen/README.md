# AI Usage & Development Process

## Why I Am Not Sharing AI Chats

During the development of this project, I used AI assistance for various tasks, but I am not providing chat logs or screenshots due to the sheer volume of content and the variety of unrelated discussions within those interactions. Instead, I will summarize how AI influenced my development process and the thought process behind each decision.

## My Development Approach

1. Consuming Data Over TCP

- I first worked on setting up data consumption over TCP, ensuring that the server could properly receive and process incoming data streams from datagen.

2. Setting Up Data Streaming to React

- Once I confirmed that data was being received from the TCP server, I explored the best way to stream data from Python to React.

- After choosing WebSocket, I implemented WebSocket communication between the backend and the frontend.

3. Selecting a Charting Library

- I searched for popular charting libraries for React.

- I chose Recharts for its ease of use, popularity and ease integration with React.

4. Developing the Data Visualization

- With WebSocket integration in place, I focused on displaying the data properly on the chart.

- I iterated on the visualization to ensure clarity and real time updates.

5. Implementing the Moving Average Calculation

- Once real time visualization was working, I moved on to the moving average computation.

- I implemented the logic and ensured it performed well within the frontend.

6. Optimizing with Broadcast Rate Control

- After everything was functional, I started thinking about further improvements.

- I introduced a broadcast rate controller, allowing dynamic adjustments to the frequency of updates for better performance.