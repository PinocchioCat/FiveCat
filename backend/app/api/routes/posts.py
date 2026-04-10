from fastapi import APIRouter

from app.schemas.posts import CreatePostRequest, PostItem
from app.services.store import store

router = APIRouter()


@router.get("", response_model=list[PostItem])
def list_posts() -> list[PostItem]:
    return store.list_posts()


@router.post("", response_model=PostItem)
def create_post(payload: CreatePostRequest) -> PostItem:
    return store.create_post(payload.model_dump())
