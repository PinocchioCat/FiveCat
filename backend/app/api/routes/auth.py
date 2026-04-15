from fastapi import APIRouter

from app.schemas.auth import LoginResponse, PhoneLoginRequest, WechatLoginRequest
from app.services.store import store

router = APIRouter()


@router.post("/phone", response_model=LoginResponse)
def phone_login(payload: PhoneLoginRequest) -> LoginResponse:
    user = store.phone_login(payload.phone, payload.role)
    return LoginResponse(access_token=f"phone-token-{user['id']}", user=user)


@router.post("/wechat", response_model=LoginResponse)
def wechat_login(payload: WechatLoginRequest) -> LoginResponse:
    user = store.wechat_login(payload.code, payload.role)
    return LoginResponse(access_token=f"wechat-token-{user['id']}", user=user)
