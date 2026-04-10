from fastapi import APIRouter, HTTPException

from app.schemas.orders import (
    AppealOrderRequest,
    CancelOrderRequest,
    CreateOrderRequest,
    OrderItem,
    ReviewOrderRequest,
    TakeOrderRequest,
)
from app.services.store import store

router = APIRouter()


@router.get("", response_model=list[OrderItem])
def list_orders() -> list[OrderItem]:
    return store.list_orders()


@router.get("/nearby", response_model=list[OrderItem])
def nearby_orders(latitude: float, longitude: float, radius_km: float = 5) -> list[OrderItem]:
    return store.nearby_orders(latitude, longitude, radius_km)


@router.post("", response_model=OrderItem)
def create_order(payload: CreateOrderRequest) -> OrderItem:
    return store.create_order(payload.model_dump())


@router.post("/{order_id}/pay", response_model=OrderItem)
def pay_order(order_id: int) -> OrderItem:
    try:
        return store.pay_order(order_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/{order_id}/accept", response_model=OrderItem)
def accept_order(order_id: int, payload: TakeOrderRequest) -> OrderItem:
    try:
        return store.accept_order(order_id, payload.sitter_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/{order_id}/start", response_model=OrderItem)
def start_service(order_id: int) -> OrderItem:
    try:
        return store.start_service(order_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/{order_id}/complete", response_model=OrderItem)
def complete_service(order_id: int) -> OrderItem:
    try:
        return store.complete_service(order_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/{order_id}/confirm", response_model=OrderItem)
def confirm_order(order_id: int, payload: ReviewOrderRequest) -> OrderItem:
    try:
        return store.confirm_order(order_id, payload.rating, payload.content, payload.reviewer_name)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/{order_id}/appeal", response_model=OrderItem)
def appeal_order(order_id: int, payload: AppealOrderRequest) -> OrderItem:
    try:
        return store.appeal_order(order_id, payload.reason)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/{order_id}/refund", response_model=OrderItem)
def refund_order(order_id: int, payload: AppealOrderRequest) -> OrderItem:
    try:
        return store.refund_order(order_id, payload.reason)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/{order_id}/cancel", response_model=OrderItem)
def cancel_order(order_id: int, payload: CancelOrderRequest) -> OrderItem:
    try:
        return store.cancel_order(order_id, payload.cancelled_by, payload.reason)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
