from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class PostAuthor(BaseModel):
    id: int
    username: str
    avatar: str
    role: str


class PostItem(BaseModel):
    id: int
    user_id: int
    content: str
    media_urls: list[str] = Field(default_factory=list)
    like_count: int = 0
    tags: list[str] = Field(default_factory=list)
    created_at: datetime
    author: PostAuthor


class CreatePostRequest(BaseModel):
    user_id: int = 1
    content: str = Field(..., min_length=3, max_length=500)
    media_urls: list[str] = Field(default_factory=list)
    tags: list[str] = Field(default_factory=list, max_length=5)
