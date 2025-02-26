import asyncio, json
from aiohttp import web
from collections import deque

DATA_BUFFER_SIZE = 30 * 100  # fixed size of 3000 samples. TD: needed to be updated dynamically
data_buffer = deque(maxlen=DATA_BUFFER_SIZE)  # deque for performance

# Global set to track connected websockets
connected_websockets = set()

async def tcp_data_consumer(host, port):
    reader, writer = await asyncio.open_connection(host, port)
    try:
        while True:
            line = await reader.readline()
            if not line:
                break

            # Decode sample from websocket and append it to the data buffer
            sample = json.loads(line.decode().strip())
            data_buffer.append(sample)

            # Prepare a message with type 'append' containing only the new sample
            message = {"type": "append", "data": sample}

            # Broadcast the new sample to all connected websockets
            for ws in connected_websockets.copy():
                try:
                    await ws.send_json(message)
                except Exception as e:
                    print("Error sending to ws:", e)
    except asyncio.CancelledError:
        print("tcp_data_consumer cancelled")
        raise
    except Exception as e:
        print("Error reading TCP stream:", e)
    finally:
        writer.close()
        await writer.wait_closed()

async def websocket_handler(request):
    ws = web.WebSocketResponse()
    await ws.prepare(request)
    
    # Add the client to the global set
    connected_websockets.add(ws)
    
    try:
        # Send a sync message containing the current data buffer
        await ws.send_json({"type": "sync", "data": list(data_buffer)})

        # Keep the connection open to handle incoming messages (if needed)
        async for msg in ws:
            # Process incoming messages if necessary
            pass

    except Exception as e:
        print("WebSocket error:", e)
    finally:
        connected_websockets.remove(ws)
        await ws.close()
        print("WebSocket closed")
    return ws

app = web.Application()
app.router.add_get('/ws', websocket_handler)

# Start the TCP consumer as a background task and store it in the app.
async def on_startup(app):
    app['tcp_task'] = asyncio.create_task(tcp_data_consumer('127.0.0.1', 9000))
    print("TCP consumer started.")

# Cancel the background task on shutdown.
async def on_shutdown(app):
    tcp_task = app.get('tcp_task')
    if tcp_task:
        tcp_task.cancel()
        try:
            await tcp_task
        except asyncio.CancelledError:
            print("tcp_data_consumer successfully cancelled.")

app.on_startup.append(on_startup)
app.on_shutdown.append(on_shutdown)

if __name__ == '__main__':
    try:
        web.run_app(app, port=8080)
    except KeyboardInterrupt:
        print("Server interrupted by user. Shutting down...")
