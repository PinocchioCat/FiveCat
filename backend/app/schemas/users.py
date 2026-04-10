from __future__ import annotations

from pydantic import BaseModel, Field

from app.schemas.common import GeoPoint


class UserProfile(BaseModel):
    id: int
    username: str
    nickname: str
    role: str
    avatar: str
    bio: str
    phone: str | None = None
    gender: str
    registered_at: str
    is_verified: bool = True
    tags: list[str] = Field(default_factory=list)
    rating: float = Field(default=5.0, ge=0, le=5)
    completed_orders: int = 0
    location: GeoPoint


class RoleSwitchRequest(BaseModel):
    role: str = Field(..., pattern="^(owner|sitter)$")


class UpdateLocationRequest(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)


class PetItem(BaseModel):
    id: int
    user_id: int
    name: str
    type: str
    species: str
    gender: str
    breed: str
    age: int
    specialty: str
    photos: list[str] = Field(default_factory=list)
