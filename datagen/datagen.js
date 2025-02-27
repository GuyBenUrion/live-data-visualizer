const net = require('net');

const PORT = 9000;
const INTERVAL = 10; // 100 times/sec

const server = net.createServer((socket) => {
    console.log('New connection established.');

    const sendData = setInterval(() => {
        const sample = Array.from({ length: 10 }, () => Math.floor(Math.random() * 21));
        socket.write(JSON.stringify(sample) + '\n');
    }, INTERVAL);

    socket.on('end', () => {
        clearInterval(sendData);
        console.log('Connection closed.');
    });

    socket.on('error', (err) => {
        clearInterval(sendData);
        console.error('Socket error:', err);
    });
});

server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});