#!/usr/bin/env python
"""Server startup script"""
import uvicorn

if __name__ == "__main__":
    # Run the socket-wrapped app
    uvicorn.run(
        "app.main:socket_app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )

