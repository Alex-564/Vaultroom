from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from fastapi import FastAPI, UploadFile, Form, File, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from redis.exceptions import RedisError

from storage import save_secret, get_secret, redis

from pydantic import BaseModel
import base64

import os
from dotenv import load_dotenv

# Pydantic model 
class SecretResponse(BaseModel):
    message: str | None = None
    fileData: str | None = None
    fileName: str | None = None
    fileMime: str | None = None
    url: str | None = None

# IP throttling at app level
limiter = Limiter(key_func=get_remote_address)
app = FastAPI()
app.state.limiter = limiter

# VERCEL AND UPTIME ORIGINS HERE
load_dotenv()
FRONTEND_ORIGIN = os.getenv("VERCEL_URL")

origins = [
    FRONTEND_ORIGIN,
]

# Allow frontend dev env
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # change to Vercel domain in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/secrets/", response_model=SecretResponse)
@limiter.limit("5/minute;50/hour")
async def create_Secret(
    request: Request,
    ttl: int = Form(...),
    message: str = Form(None),
    file: UploadFile = File(None)
):
    
    # Valid type check
    if not message and not file:
        raise HTTPException(status_code=400, detail="Must provide message or file")

    # Parse data, save it to redis, generate URL
    file_data = await file.read() if file else None
    secret_id = save_secret(
        message=message,
        file=file_data,
        file_name=file.filename if file else None,
        file_mime=file.content_type if file else None,
        ttl=ttl
    )

    return {"url": f"/secrets/{secret_id}"}


@app.get("/api/secrets/{secret_id}", response_model=SecretResponse)
async def retrieve_secret(secret_id: str):
    result = get_secret(secret_id)
    if not result:
        raise HTTPException(status_code=404, detail="Secret not found or expired")

    response = {
        "message": result["message"],
        "fileName": result["file_name"],
        "fileMime": result["file_mime"],
        "fileData": base64.b64encode(result["file"]).decode() if result["file"] else None
    }
    return JSONResponse(content=response)


@app.get("/healthcheck")
async def healthcheck():
    try:
        await redis.ping()
        return {"status": "ok"}
    except RedisError:
        raise HTTPException(status_code=503, detail="Redis Unavailable")