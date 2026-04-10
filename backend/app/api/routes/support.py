from fastapi import APIRouter

from app.schemas.support import CreateSupportMessageRequest, SupportMessage, TemporarySupportSession
from app.services.store import store

router = APIRouter()


@router.post('/temporary-session', response_model=TemporarySupportSession)
def create_temporary_support_session() -> TemporarySupportSession:
    return store.create_temporary_support_session()


@router.get('/messages', response_model=list[SupportMessage])
def list_support_messages(user_id: int | None = None, guest_session_id: str | None = None) -> list[SupportMessage]:
    return store.list_support_messages(user_id=user_id, guest_session_id=guest_session_id)


@router.post('/messages', response_model=list[SupportMessage])
def create_support_message(
    payload: CreateSupportMessageRequest,
    user_id: int | None = None,
    guest_session_id: str | None = None,
) -> list[SupportMessage]:
    return store.create_support_message(user_id=user_id, guest_session_id=guest_session_id, content=payload.content)
