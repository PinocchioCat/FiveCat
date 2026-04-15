from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.users import UserProfile


class PhoneLoginRequest(BaseModel):
    phone: str = Field(..., min_length=11, max_length=11)
    code: str = Field(..., min_length=4, max_length=6)
    role: Literal["owner", "sitter"]


class WechatLoginRequest(BaseModel):
    scene: str = Field(default="web_qr")
    code: str = Field(..., min_length=4)
    role: Literal["owner", "sitter"]


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserProfile
