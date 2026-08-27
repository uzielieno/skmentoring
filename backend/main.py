"""
Entrée standard pour les providers cloud qui cherchent `main:app` par défaut
(Railway, Render, Fly, Vercel, Heroku…).

Le code réel est dans `server.py`. Ce module se contente de le re-exporter.
"""
from server import app  # noqa: F401

if __name__ == "__main__":
    import os
    import uvicorn
    uvicorn.run(
        "server:app",
        host=os.environ.get("HOST", "0.0.0.0"),
        port=int(os.environ.get("PORT", "8001")),
        reload=False,
    )
