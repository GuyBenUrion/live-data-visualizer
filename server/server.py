import asyncio, json
from aiohttp import web
from collections import deque

DATA_BUFFER_SIZE = 30 * 100 # needed to be updated dynamically based on the data rate
data_buffer = deque(maxlen=DATA_BUFFER_SIZE) # used deque instead of list for better fixed size buffer performance

async def tcp_data_consumer(host, port):
    reader, writer = await asyncio.open_connection(host, port)
    try:
        while True:
            line = await reader.readline()
            if not line:
                break

            # Decode the received JSON sample (an array of 10 numbers)
            sample = json.loads(line.decode().strip())
            data_buffer.append(sample) # will automatically remove the oldest sample if buffer is full

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
    try:
        while not ws.closed:
            await ws.send_json(list(data_buffer))
    except Exception as e:
        print("WebSocket error:", e)
    finally:
        await ws.close()
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
