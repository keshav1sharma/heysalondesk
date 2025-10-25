import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # LiveKit
    LIVEKIT_URL = os.getenv("LIVEKIT_URL")
    LIVEKIT_API_KEY = os.getenv("LIVEKIT_API_KEY")
    LIVEKIT_API_SECRET = os.getenv("LIVEKIT_API_SECRET")

    # Backend
    BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:3000/api")

    # Mem0
    MEM0_API_KEY = os.getenv("MEM0_API_KEY")

    # OpenAI
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

config = Config()
