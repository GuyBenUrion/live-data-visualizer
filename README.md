# **Real-Time Data Visualization Dashboard**

## **Overview**  
This project implements a real-time data visualization dashboard that streams and displays incoming data from a TCP server. The system is designed to handle high-frequency data (100 samples per second, each with 10 values) and visualize it using a live-updating chart. 

## **Architecture & Components**
1. Data Generator
- (datagen.js - Node.js TCP Server): A simple TCP server generates random data samples every 10ms (100 samples/sec) and sends them to connected clients.

2. Backend (Python, Aiohttp, WebSockets)
- Listens for incoming TCP data and stores it in a deque buffer (30 seconds of data).
- Supports WebSocket connections to stream data to the frontend.
- Offers an endpoint to control the broadcast interval of data updates.

3. Frontend (React, Recharts)
- Displays 10 real-time data channels on a live line chart.
- Offers a toggle to switch between raw data and a moving average chart.
- Allows users to set the broadcast at different rates.

4. Docker & Deployment
- The system is containerized using Docker and managed with Docker Compose.

---

## **Challenges & Trade-offs & **
1. Moving Average Compute
- Computing the moving average on the frontend was quicker and easier using React's useMemo, and since the load isn't too heavy, the frontend can handle it for now. However, for better scalability in the future, moving this logic to the backend would be a cleaner solution to reduce client-side processing.

2.  Server Client Management
- Currently, the server handles all clients uniformly, broadcasting the same data to everyone. For better scalability, the system should manage clients individually, allowing dynamic task assignment per client. This would enable more efficient resource allocation and personalized data streams based on client-specific needs.

3. Dynamic Sampling Rate Handling
- Currently, the system processes a fixed sample rate of 100 samples per second. To improve flexibility, a dynamic rate monitor should be implemented to handle varying sample rates. This would allow the system to adapt to different data sources, ensuring smooth processing and visualization without performance bottlenecks.

---

## **Setup & Running The Project**  

1. Clone repo to your local machine:
```sh
$ git clone https://github.com/GuyBenUrion/live-data-visualizer.git
$ cd live-data-visualizer
```

2. Run the project with Docker Compose
```sh
$ docker-compose up --build
```

3. Open web server on http://localhost:5173/ or http://172.19.0.4:5173/

---

## **Deliverables**  
1. Access to forked repository, containing a `README.md` with updated instructions.
1. A **short design document** (can be a markdown file in the repo) covering:
   - Architecture choices (data handling, communication, rendering strategy).
   - Challenges faced and trade-offs made due to time constraints.
   - What you'd improve or do differently with more time.
---

## **Discussion Topics for the Interview**  
After completing the assignment, we’ll discuss:
- **Backend Design:** How did you handle the data stream? How does the backend communicate with the frontend?
- **Frontend Architecture:** How does the frontend manage state and performance while rendering real-time data?
- **Performance Optimizations:** How does the system scale with a higher sampling rate or more channels?
- **Trade-offs & Improvements:** What challenges did you face, and how would you improve the system?

---

## **Next Steps**  
1. Clone the provided repo and set up your development environment.
2. Implement the backend and frontend as described.
3. Submit your forked repository with your code and documentation.

Good luck! 🚀
