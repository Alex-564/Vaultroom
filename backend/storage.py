import os
import uuid
import base64

from redis import Redis
from cryptography.fernet import Fernet
from dotenv import load_dotenv

# Load env vars
load_dotenv()
redis = Redis.from_url(os.getenv("REDIS_URL"), decode_responses=False)
fernet = Fernet(os.getenv("SECRET_KEY").encode())

def save_secret(message: str | None, file: bytes | None, file_name: str | None, file_mime: str | None, ttl: int):
    secret_id = str(uuid.uuid4())
    payload = {}

    # Payload specific types
    if message:
        payload["message"] = fernet.encrypt(message.encode())

    if file:
        payload["file"] = fernet.encrypt(file)
        payload["file_name"] = file_name.encode()
        payload["file_mime"] = file_mime.encode()

    # Combine all into one dict and store as JSON
    redis.setex(secret_id, ttl, str(payload))  # simple string serialization
    return secret_id


def get_secret(secret_id: str):
    data = redis.get(secret_id)
    if not data:
        return None

    redis.delete(secret_id)  # one-time access

    # Eval the stringified dict back to a real one (safe since we control both sides)
    payload = eval(data.decode())

    return {
        "message": fernet.decrypt(payload["message"]).decode() if "message" in payload else None,
        "file": fernet.decrypt(payload["file"]) if "file" in payload else None,
        "file_name": payload.get("file_name", b"").decode(),
        "file_mime": payload.get("file_mime", b"").decode()
    }