import asyncio

from aegis_alert_bridge import start_aegis_integrated_stream, example_chatbot_callback


if __name__ == "__main__":
    # Run the bridge in demo mode which uses the alert_stream.demo generator
    asyncio.run(start_aegis_integrated_stream(
        callback=example_chatbot_callback,
        mode="demo"
    ))
