from fastapi import APIRouter

from app.schemas.common import ApiMessage
from app.schemas.users import PetItem, RoleSwitchRequest, UpdateLocationRequest, UserProfile
from app.services.store import store

router = APIRouter()


@router.get("/me", response_model=UserProfile)
def get_me(user_id: int = 1) -> UserProfile:
    return store.get_user(user_id)


@router.patch("/me/role", response_model=UserProfile)
def switch_role(payload: RoleSwitchRequest, user_id: int = 1) -> UserProfile:
    return store.switch_role(user_id, payload.role)


@router.patch("/me/location", response_model=UserProfile)
def update_location(payload: UpdateLocationRequest, user_id: int = 1) -> UserProfile:
    return store.update_location(user_id, payload.latitude, payload.longitude)


@router.get("/me/pets", response_model=list[PetItem])
def list_my_pets(user_id: int = 1) -> list[PetItem]:
    return store.list_pets(user_id)


@router.post("/send-code", response_model=ApiMessage)
def send_phone_code(phone: str) -> ApiMessage:
    return ApiMessage(message=f"验证码 2468 已发送到 {phone}，当前为演示模式。")
