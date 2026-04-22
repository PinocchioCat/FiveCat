from fastapi import APIRouter, HTTPException, Query

from app.schemas.posts import CreatePostRequest, PostItem
from app.services.store import store

router = APIRouter()


@router.get("", response_model=list[PostItem])
def list_posts() -> list[PostItem]:
    return store.list_posts()


@router.post("", response_model=PostItem)
def create_post(payload: CreatePostRequest) -> PostItem:
    return store.create_post(payload.model_dump())


@router.delete("/{post_id}", response_model=PostItem)
def delete_post(post_id: int, user_id: int = Query(..., ge=1)) -> PostItem:
    try:
        return store.delete_post(post_id, user_id)
    except ValueError as error:
        message = str(error)
        status_code = 403 if 'author' in message else 404
        raise HTTPException(status_code=status_code, detail=message) from error
