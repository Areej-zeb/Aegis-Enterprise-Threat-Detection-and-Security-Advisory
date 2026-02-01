from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
import uuid

router = APIRouter(prefix="/api/auth", tags=["auth"])

class LoginRequest(BaseModel):
    email: str
    password: str

class SignupRequest(BaseModel):
    email: str
    password: str
    name: Optional[str] = None

class User(BaseModel):
    id: str
    email: str
    name: Optional[str] = "Admin User"
    role: str = "admin"

class AuthResponse(BaseModel):
    token: str
    user: User

MOCK_TOKEN = "mock-jwt-token-aegis-123"

@router.post("/login", response_model=AuthResponse)
async def login(creds: LoginRequest):
    # Accept any login for MV
    return {
        "token": MOCK_TOKEN,
        "user": {
            "id": str(uuid.uuid4()),
            "email": creds.email,
            "name": "Security Analyst",
            "role": "admin"
        }
    }

@router.post("/signup", response_model=AuthResponse)
async def signup(creds: SignupRequest):
    return {
        "token": MOCK_TOKEN,
        "user": {
            "id": str(uuid.uuid4()),
            "email": creds.email,
            "name": creds.name or "New Analyst",
            "role": "admin"
        }
    }

@router.post("/logout")
async def logout():
    return {"message": "Logged out"}
