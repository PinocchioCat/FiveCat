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
    weight_kg: float | None = None
    specialty: str
    habits: str | None = None
    emergency_phone: str | None = None
    photos: list[str] = Field(default_factory=list)


class CreatePetRequest(BaseModel):
    user_id: int
    name: str = Field(..., min_length=1, max_length=30)
    type: str = Field(..., pattern="^(dog|cat|other)$")
    species: str = Field(..., min_length=1, max_length=30)
    gender: str = Field(..., pattern="^(male|female|unknown)$")
    breed: str = Field(..., min_length=1, max_length=50)
    age: int = Field(..., ge=0, le=40)
    weight_kg: float | None = Field(default=None, ge=0, le=120)
    specialty: str = Field(..., min_length=1, max_length=300)
    habits: str | None = Field(default=None, max_length=300)
    emergency_phone: str | None = Field(default=None, max_length=20)
    photos: list[str] = Field(default_factory=list, min_length=1, max_length=1)
