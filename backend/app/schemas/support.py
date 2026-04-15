from __future__ import annotations

from pydantic import BaseModel, Field


class SupportMessage(BaseModel):
    id: int
    user_id: int
    sender: str = Field(..., pattern='^(user|support)$')
    content: str = Field(..., min_length=1, max_length=500)
    created_at: str


class CreateSupportMessageRequest(BaseModel):
    content: str = Field(..., min_length=1, max_length=500)


class TemporarySupportSession(BaseModel):
    session_id: str
    is_temporary: bool = True
    messages: list[SupportMessage]
