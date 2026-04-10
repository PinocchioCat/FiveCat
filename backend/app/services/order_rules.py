from __future__ import annotations

from datetime import datetime, timedelta
from math import ceil


PAYMENT_WINDOW_MINUTES = 20
HALF_HOUR_MINUTES = {0, 30}
SERVICE_TYPES_WITH_PREMIUM = {'投喂并陪玩', '下楼溜猫'}
SPRING_FESTIVAL_WINDOWS = {
    2025: (datetime(2025, 1, 28), datetime(2025, 2, 4, 23, 59, 59)),
    2026: (datetime(2026, 2, 17), datetime(2026, 2, 24, 23, 59, 59)),
    2027: (datetime(2027, 2, 6), datetime(2027, 2, 13, 23, 59, 59)),
}


def is_half_hour_slot(value: datetime) -> bool:
    return value.minute in HALF_HOUR_MINUTES and value.second == 0 and value.microsecond == 0


def is_spring_festival(value: datetime) -> bool:
    window = SPRING_FESTIVAL_WINDOWS.get(value.year)
    if window is None:
        return False
    start, end = window
    return start <= value <= end


def validate_service_window(start_time: datetime, end_time: datetime, now: datetime | None = None) -> None:
    current_time = now or datetime.now()
    if start_time <= current_time:
        raise ValueError('开始时间必须晚于当前时间')
    if end_time <= start_time:
        raise ValueError('结束时间必须晚于开始时间')
    if not is_half_hour_slot(start_time) or not is_half_hour_slot(end_time):
        raise ValueError('服务时间只能选择整点或半点')


def calculate_pet_count_surcharge(pet_count: int) -> int:
    if pet_count <= 1:
        return 0
    return ceil((pet_count - 1) / 2) * 5


def calculate_distance_surcharge(distance_km: float) -> int:
    extra_distance = max(distance_km - 3, 0)
    if extra_distance <= 0:
        return 0
    return ceil(extra_distance) * 5


def calculate_order_pricing(
    *,
    service_type: str,
    pet_count: int,
    distance_km: float,
    service_start_time: datetime,
) -> dict:
    base_price = 40
    pet_count_surcharge = calculate_pet_count_surcharge(pet_count)
    distance_surcharge = calculate_distance_surcharge(distance_km)
    service_surcharge = 10 if service_type in SERVICE_TYPES_WITH_PREMIUM else 0
    holiday_surcharge = 10 if is_spring_festival(service_start_time) else 0
    total_price = base_price + pet_count_surcharge + distance_surcharge + service_surcharge + holiday_surcharge
    return {
        'base_price': base_price,
        'pet_count_surcharge': pet_count_surcharge,
        'distance_surcharge': distance_surcharge,
        'service_surcharge': service_surcharge,
        'holiday_surcharge': holiday_surcharge,
        'total_price': total_price,
    }


def payment_deadline(created_at: datetime) -> datetime:
    return created_at + timedelta(minutes=PAYMENT_WINDOW_MINUTES)
