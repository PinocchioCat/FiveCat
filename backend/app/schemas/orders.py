from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field, model_validator

from app.schemas.common import GeoPoint
from app.services.order_rules import validate_service_window


class OrderPricing(BaseModel):
    base_price: int
    pet_count_surcharge: int
    distance_surcharge: int
    service_surcharge: int
    holiday_surcharge: int
    total_price: int


class OrderReview(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    content: str = Field(..., min_length=2, max_length=300)
    reviewer_name: str
    created_at: datetime


class OrderBase(BaseModel):
    service_type: str
    title: str = Field(..., min_length=4, max_length=80)
    description: str = Field(..., min_length=8, max_length=500)
    service_start_time: datetime
    service_end_time: datetime
    duration_minutes: int = Field(default=30, ge=0, le=60)
    pet_count: int = Field(..., ge=1, le=5)
    pet_species: str = Field(..., min_length=1, max_length=30)
    pet_species_other: str | None = Field(default=None, max_length=50)
    pet_ids: list[int] = Field(default_factory=list)
    location: GeoPoint
    detailed_address: str = Field(..., min_length=8, max_length=200)
    key_handover_method: str = Field(default='待铲屎官接单后一对一联系对接', min_length=4, max_length=80)
    pet_temperament: str = Field(..., min_length=2, max_length=200)
    vaccination_status: str = Field(..., pattern='^(已齐全|未齐全)$')
    vaccination_notes: str | None = Field(default=None, max_length=200)

class CreateOrderRequest(OrderBase):
    owner_id: int = 1

    @model_validator(mode='after')
    def validate_order_payload(self) -> 'CreateOrderRequest':
        if self.pet_species == '其他' and not (self.pet_species_other or '').strip():
            raise ValueError('pet_species_other is required when pet_species is 其他')
        validate_service_window(self.service_start_time, self.service_end_time)
        if self.vaccination_status == '未齐全' and not (self.vaccination_notes or '').strip():
            raise ValueError('vaccination_notes is required when vaccination_status is 未齐全')
        return self


class OrderItem(OrderBase):
    id: int
    owner_id: int
    sitter_id: int | None = None
    status: str
    price: int
    service_time: datetime
    distance_km: float = 0
    created_at: datetime
    payment_deadline_at: datetime | None = None
    payment_paid_at: datetime | None = None
    accepted_at: datetime | None = None
    contacts_unlocked_at: datetime | None = None
    service_started_at: datetime | None = None
    service_completed_at: datetime | None = None
    completed_at: datetime | None = None
    cancelled_at: datetime | None = None
    cancelled_by: str | None = None
    cancel_reason: str | None = None
    owner_cancel_penalty: int = 0
    pricing: OrderPricing | None = None
    review: OrderReview | None = None


class TakeOrderRequest(BaseModel):
    sitter_id: int = 2


class ReviewOrderRequest(BaseModel):
    reviewer_name: str = '宠主'
    rating: int = Field(default=5, ge=1, le=5)
    content: str = Field(..., min_length=2, max_length=300)


class CancelOrderRequest(BaseModel):
    cancelled_by: str = Field(..., pattern='^(owner|sitter|system)$')
    reason: str | None = Field(default=None, max_length=200)


class AppealOrderRequest(BaseModel):
    reason: str = Field(..., min_length=2, max_length=200)


class NearbyOrderQuery(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    radius_km: float = Field(default=5, ge=0.5, le=30)
