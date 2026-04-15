from fastapi import APIRouter

from app.services.store import store

router = APIRouter()


@router.get("/overview")
def home_overview(user_id: int = 1) -> dict:
    return store.home_overview(user_id)
