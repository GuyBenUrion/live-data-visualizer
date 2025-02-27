import aiohttp_cors
import asyncio, json
from aiohttp import web
from collections import deque

# setting up the global variables
DATA_BUFFER_SIZE = 30 * 100  # fixed size of 3000 samples. TD: needed to be updated dynamically
data_buffer = deque(maxlen=DATA_BUFFER_SIZE)  # deque for performance
connected_websockets = set()
broadcast_interval = 0
latest_message = None

# handle client post request to start/stop timed broadcasting
async def get_broadcast_interval(request):
    global broadcast_interval, app

    # get interval time
    try:
        interval = await request.json()
    except Exception as e:
        return web.json_response({"error": "Invalid JSON"}, status=400)

    broadcast_interval = interval.get("interval")
    if broadcast_interval is None:
        return web.json_response({"error": "Missing 'interval' parameter"}, status=400)

    # client asked for timed broadcasting, assign broadcast task
    if broadcast_interval > 0:
        app['broadcast_task'] = asyncio.create_task(broadcast_messages())

    # client asked real time broadcasting, cancel the broadcast task
    if broadcast_interval == 0:
        if app['broadcast_task']:
            app['broadcast_task'].cancel()
            try:
                await app['broadcast_task']
            except asyncio.CancelledError:
                print("broadcast_messages successfully cancelled.")

    return web.json_response({"message": "Parameter received", "interval": interval})

# broadcast the latest message to all connected clients and sleep for the interval
async def broadcast_messages():
    while True:
        if latest_message is not None and broadcast_interval > 0:
            for ws in connected_websockets.copy():
                try:
                    await ws.send_json(latest_message)
                except Exception as e:
                    print("Error sending to ws:", e)
        await asyncio.sleep(broadcast_interval / 1000)

# consume TCP data and store it in the data buffer, then continue to broadcast strategy
async def tcp_data_consumer(host, port):
    reader, writer = await asyncio.open_connection(host, port)
    global latest_message
    try:
        while True:
            line = await reader.readline()
            if not line:
                break

            sample = json.loads(line.decode().strip())
            data_buffer.appendleft(sample)
            message = {"type": "append", "data": sample}

            # If broadcast_interval is 0, send the message to all connected clients immediately
            if broadcast_interval == 0:
                for ws in connected_websockets.copy():
                    try:
                        await ws.send_json(message)
                    except Exception as e:
                        print("Error sending to ws:", e)

                    latest_message = None

            # Otherwise, store the message to be timed broadcasted
            else:
                latest_message = message

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
    print("WebSocket connection established")
    connected_websockets.add(ws)
    
    try:
        # Send a sync message containing the current data buffer
        await ws.send_json({"type": "sync", "data": list(data_buffer)})

        # Keep the connection open to handle incoming messages (if needed)
        async for msg in ws:
            pass

    except Exception as e:
        print("WebSocket error:", e)
    finally:
        connected_websockets.remove(ws)
        await ws.close()
        print("WebSocket connection closed")
    return ws

app = web.Application()
app.router.add_get('/ws', websocket_handler)
app.router.add_post('/broadcast_interval', get_broadcast_interval)

# Enable CORS for all routes 
cors = aiohttp_cors.setup(app, defaults={
    "*": aiohttp_cors.ResourceOptions(
        allow_credentials=True,
        expose_headers="*",
        allow_headers="*"
    )
})
for route in list(app.router.routes()):
    cors.add(route)

# Start the TCP consumer as a background task and store it in the app.
async def on_startup(app):
    app['tcp_task'] = asyncio.create_task(tcp_data_consumer('datagen', 9000))
    print("TCP consumer started.")

# Cancel the background tasks on shutdown
async def on_shutdown(app):
    if app['tcp_task']:
        app['tcp_task'].cancel()
        try:
            await app['tcp_task']
        except asyncio.CancelledError:
            print("tcp_data_consumer successfully cancelled.")
    if app['broadcast_task']:
        app['broadcast_task'].cancel()
        try:
            await app['broadcast_task']
        except asyncio.CancelledError:
            print("broadcast_messages successfully cancelled.")

app.on_startup.append(on_startup)
app.on_shutdown.append(on_shutdown)

if __name__ == '__main__':
    try:
        web.run_app(app, port=8080)
    except KeyboardInterrupt:
        print("Server interrupted by user. Shutting down...")
