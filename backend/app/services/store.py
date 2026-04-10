from __future__ import annotations

from copy import deepcopy
from datetime import datetime, timedelta
from uuid import uuid4

from app.data.mock_data import deep_seed
from app.services.geo import haversine_distance_km
from app.services.order_rules import calculate_order_pricing, payment_deadline

SUPPORT_DEFAULT_MESSAGE = '\n'.join(
    [
        '您好！，家里的毛孩子是需要什么样的服务？',
        '关于更多毛孩子的服务或者问题，欢迎与我沟通交流。',
        '电话：15216899711  微信：123qaz22',
    ]
)
TEMPORARY_SUPPORT_USER_ID = 0


class MockStore:
    def __init__(self) -> None:
        self.reset()

    def reset(self) -> None:
        self._data = deep_seed()
        self._temporary_support_sessions: dict[str, list[dict]] = {}

    def _find_user(self, user_id: int) -> dict:
        for user in self._data['users']:
            if user['id'] == user_id:
                return user
        raise ValueError(f'User {user_id} not found')

    def _find_user_by_phone(self, phone: str) -> dict | None:
        return next((item for item in self._data['users'] if item.get('phone') == phone), None)

    def _find_seed_user_by_role(self, role: str) -> dict:
        user = next((item for item in self._data['users'] if item['role'] == role), None)
        if user is None:
            user = self._data['users'][0]
            user['role'] = role
        return user

    def _serialize_user(self, user: dict) -> dict:
        return {
            'id': user['id'],
            'username': user['username'],
            'nickname': user.get('nickname', user['username']),
            'role': user['role'],
            'avatar': user['avatar'],
            'bio': user['bio'],
            'phone': user.get('phone'),
            'gender': user.get('gender', 'other'),
            'registered_at': user.get('registered_at', datetime.now().isoformat()),
            'is_verified': user.get('is_verified', True),
            'tags': user.get('tags', []),
            'rating': user.get('rating', 5.0),
            'completed_orders': user.get('completed_orders', 0),
            'location': {
                'latitude': user['latitude'],
                'longitude': user['longitude'],
            },
        }

    def _serialize_order(self, order: dict, viewer_lat: float | None = None, viewer_lng: float | None = None) -> dict:
        payload = deepcopy(order)
        if viewer_lat is not None and viewer_lng is not None:
            payload['distance_km'] = haversine_distance_km(
                viewer_lat,
                viewer_lng,
                payload['latitude'],
                payload['longitude'],
            )
        return {
            'id': payload['id'],
            'owner_id': payload['owner_id'],
            'sitter_id': payload['sitter_id'],
            'status': payload['status'],
            'service_type': payload['service_type'],
            'title': payload['title'],
            'description': payload['description'],
            'price': payload['price'],
            'service_time': payload.get('service_time', payload['service_start_time']),
            'service_start_time': payload['service_start_time'],
            'service_end_time': payload['service_end_time'],
            'duration_minutes': payload['duration_minutes'],
            'pet_count': payload.get('pet_count', 1),
            'pet_species': payload.get('pet_species', '其他'),
            'pet_species_other': payload.get('pet_species_other'),
            'pet_ids': payload.get('pet_ids', []),
            'detailed_address': payload.get('detailed_address', ''),
            'key_handover_method': payload.get('key_handover_method', '待铲屎官接单后一对一联系对接'),
            'pet_temperament': payload.get('pet_temperament', ''),
            'vaccination_status': payload.get('vaccination_status', '已齐全'),
            'vaccination_notes': payload.get('vaccination_notes'),
            'distance_km': payload.get('distance_km', 0),
            'created_at': payload['created_at'],
            'payment_deadline_at': payload.get('payment_deadline_at'),
            'payment_paid_at': payload.get('payment_paid_at'),
            'accepted_at': payload.get('accepted_at'),
            'contacts_unlocked_at': payload.get('contacts_unlocked_at'),
            'service_started_at': payload.get('service_started_at'),
            'service_completed_at': payload.get('service_completed_at'),
            'completed_at': payload.get('completed_at'),
            'cancelled_at': payload.get('cancelled_at'),
            'cancelled_by': payload.get('cancelled_by'),
            'cancel_reason': payload.get('cancel_reason'),
            'owner_cancel_penalty': payload.get('owner_cancel_penalty', 0),
            'pricing': payload.get('pricing'),
            'review': payload.get('review'),
            'location': {
                'latitude': payload['latitude'],
                'longitude': payload['longitude'],
            },
        }

    def _serialize_post(self, post: dict) -> dict:
        author = self._find_user(post['user_id'])
        return {
            'id': post['id'],
            'user_id': post['user_id'],
            'content': post['content'],
            'media_urls': post.get('media_urls', []),
            'like_count': post.get('like_count', 0),
            'tags': post.get('tags', []),
            'created_at': post['created_at'],
            'author': {
                'id': author['id'],
                'username': author['username'],
                'avatar': author['avatar'],
                'role': author['role'],
            },
        }

    def _serialize_support_message(self, message: dict) -> dict:
        return deepcopy(message)

    def _next_support_message_id(self) -> int:
        persisted_ids = [item['id'] for item in self._data['support_messages']]
        temporary_ids = [item['id'] for messages in self._temporary_support_sessions.values() for item in messages]
        return max([0, *persisted_ids, *temporary_ids]) + 1

    def _support_welcome_message(self, user_id: int, created_at: str | None = None) -> dict:
        return {
            'id': self._next_support_message_id(),
            'user_id': user_id,
            'sender': 'support',
            'content': SUPPORT_DEFAULT_MESSAGE,
            'created_at': created_at or datetime.now().isoformat(),
        }

    def _support_reply_message(self, user_id: int, content: str) -> dict:
        return {
            'id': self._next_support_message_id(),
            'user_id': user_id,
            'sender': 'support',
            'content': f'您好！已经收到你的消息：{content}。如果方便的话，也可以继续告诉我毛孩子的品种、所在区域和期望服务时间，我会继续帮你安排。',
            'created_at': (datetime.now() + timedelta(minutes=1)).isoformat(),
        }

    def _ensure_user_support_conversation(self, user_id: int) -> None:
        if any(item['user_id'] == user_id for item in self._data['support_messages']):
            return
        self._data['support_messages'].append(self._support_welcome_message(user_id))

    def _ensure_temporary_support_session(self, session_id: str) -> list[dict]:
        if session_id not in self._temporary_support_sessions:
            self._temporary_support_sessions[session_id] = [self._support_welcome_message(TEMPORARY_SUPPORT_USER_ID)]
        return self._temporary_support_sessions[session_id]

    def _find_order(self, order_id: int) -> dict:
        for order in self._data['orders']:
            if order['id'] == order_id:
                return order
        raise ValueError(f'Order {order_id} not found')

    def _expire_unpaid_orders(self) -> None:
        current_time = datetime.now()
        for order in self._data['orders']:
            deadline = order.get('payment_deadline_at')
            if order['status'] != 'pending_payment' or not deadline:
                continue
            if datetime.fromisoformat(deadline) > current_time:
                continue
            order['status'] = 'cancelled'
            order['cancelled_at'] = current_time.isoformat()
            order['cancelled_by'] = 'system'
            order['cancel_reason'] = '支付超时自动取消'

    def _resolve_order_distance_km(self, owner_id: int, latitude: float, longitude: float) -> float:
        owner = self._find_user(owner_id)
        return haversine_distance_km(owner['latitude'], owner['longitude'], latitude, longitude)

    def _build_order_pricing(self, payload: dict, distance_km: float) -> dict:
        return calculate_order_pricing(
            service_type=payload['service_type'],
            pet_count=payload['pet_count'],
            distance_km=distance_km,
            service_start_time=payload['service_start_time'],
        )

    def phone_login(self, phone: str, role: str) -> dict:
        user = self._find_user_by_phone(phone)
        if user is None:
            role_label = '宠主' if role == 'owner' else '铲屎官'
            user = {
                'id': max(item['id'] for item in self._data['users']) + 1,
                'username': f'用户{phone[-4:]}',
                'nickname': phone[-4:],
                'role': role,
                'avatar': 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=240&q=80',
                'bio': f'手机号注册的新{role_label}',
                'phone': phone,
                'gender': 'other',
                'registered_at': datetime.now().isoformat(),
                'is_verified': False,
                'tags': ['兼职铲屎官'] if role == 'sitter' else ['新宠主'],
                'latitude': 31.2304,
                'longitude': 121.4737,
                'rating': 5.0,
                'completed_orders': 0,
            }
            self._data['users'].append(user)
        else:
            user['role'] = role
        return self._serialize_user(user)

    def wechat_login(self, code: str, role: str) -> dict:
        user = self._find_seed_user_by_role(role)
        return self._serialize_user(user)

    def get_user(self, user_id: int = 1) -> dict:
        return self._serialize_user(self._find_user(user_id))

    def switch_role(self, user_id: int, role: str) -> dict:
        user = self._find_user(user_id)
        user['role'] = role
        if role == 'sitter' and not user.get('tags'):
            user['tags'] = ['兼职铲屎官']
        return self._serialize_user(user)

    def update_location(self, user_id: int, latitude: float, longitude: float) -> dict:
        user = self._find_user(user_id)
        user['latitude'] = latitude
        user['longitude'] = longitude
        return self._serialize_user(user)

    def list_pets(self, user_id: int = 1) -> list[dict]:
        return [deepcopy(pet) for pet in self._data['pets'] if pet['user_id'] == user_id]

    def create_temporary_support_session(self) -> dict:
        session_id = f'guest-{uuid4().hex}'
        messages = self._ensure_temporary_support_session(session_id)
        return {
            'session_id': session_id,
            'is_temporary': True,
            'messages': [self._serialize_support_message(item) for item in sorted(messages, key=lambda item: item['created_at'])],
        }

    def list_support_messages(self, user_id: int | None = None, guest_session_id: str | None = None) -> list[dict]:
        if guest_session_id:
            items = self._ensure_temporary_support_session(guest_session_id)
            items.sort(key=lambda item: item['created_at'])
            return [self._serialize_support_message(item) for item in items]

        resolved_user_id = user_id or 1
        self._ensure_user_support_conversation(resolved_user_id)
        items = [item for item in self._data['support_messages'] if item['user_id'] == resolved_user_id]
        items.sort(key=lambda item: item['created_at'])
        return [self._serialize_support_message(item) for item in items]

    def create_support_message(self, content: str, user_id: int | None = None, guest_session_id: str | None = None) -> list[dict]:
        if guest_session_id:
            messages = self._ensure_temporary_support_session(guest_session_id)
            messages.append(
                {
                    'id': self._next_support_message_id(),
                    'user_id': TEMPORARY_SUPPORT_USER_ID,
                    'sender': 'user',
                    'content': content,
                    'created_at': datetime.now().isoformat(),
                }
            )
            messages.append(self._support_reply_message(TEMPORARY_SUPPORT_USER_ID, content))
            return self.list_support_messages(guest_session_id=guest_session_id)

        resolved_user_id = user_id or 1
        self._ensure_user_support_conversation(resolved_user_id)
        self._data['support_messages'].append(
            {
                'id': self._next_support_message_id(),
                'user_id': resolved_user_id,
                'sender': 'user',
                'content': content,
                'created_at': datetime.now().isoformat(),
            }
        )
        self._data['support_messages'].append(self._support_reply_message(resolved_user_id, content))
        return self.list_support_messages(user_id=resolved_user_id)

    def list_posts(self) -> list[dict]:
        return [self._serialize_post(post) for post in sorted(self._data['posts'], key=lambda item: item['created_at'], reverse=True)]

    def create_post(self, payload: dict) -> dict:
        post = {
            'id': max(item['id'] for item in self._data['posts']) + 1,
            'user_id': payload['user_id'],
            'content': payload['content'],
            'media_urls': payload.get('media_urls', []),
            'like_count': 0,
            'tags': payload.get('tags', []),
            'created_at': datetime.now().isoformat(),
        }
        self._data['posts'].insert(0, post)
        return self._serialize_post(post)

    def nearby_orders(self, latitude: float, longitude: float, radius_km: float) -> list[dict]:
        self._expire_unpaid_orders()
        matches = []
        for order in self._data['orders']:
            if order['status'] != 'pending':
                continue
            distance = haversine_distance_km(latitude, longitude, order['latitude'], order['longitude'])
            if distance <= radius_km:
                matches.append(self._serialize_order(order, latitude, longitude))
        return sorted(matches, key=lambda item: item['distance_km'])

    def list_orders(self) -> list[dict]:
        self._expire_unpaid_orders()
        return [self._serialize_order(order) for order in sorted(self._data['orders'], key=lambda item: item['created_at'], reverse=True)]

    def create_order(self, payload: dict) -> dict:
        created_at = datetime.now()
        distance_km = self._resolve_order_distance_km(
            payload['owner_id'],
            payload['location']['latitude'],
            payload['location']['longitude'],
        )
        pricing = self._build_order_pricing(payload, distance_km)
        order = {
            'id': max(item['id'] for item in self._data['orders']) + 1,
            'owner_id': payload['owner_id'],
            'sitter_id': None,
            'status': 'pending_payment',
            'service_type': payload['service_type'],
            'title': payload['title'],
            'description': payload['description'],
            'price': pricing['total_price'],
            'service_time': payload['service_start_time'].isoformat(),
            'service_start_time': payload['service_start_time'].isoformat(),
            'service_end_time': payload['service_end_time'].isoformat(),
            'duration_minutes': payload['duration_minutes'],
            'pet_count': payload['pet_count'],
            'pet_species': payload['pet_species'],
            'pet_species_other': payload.get('pet_species_other'),
            'detailed_address': payload['detailed_address'],
            'key_handover_method': payload['key_handover_method'],
            'pet_temperament': payload['pet_temperament'],
            'vaccination_status': payload['vaccination_status'],
            'vaccination_notes': payload.get('vaccination_notes'),
            'latitude': payload['location']['latitude'],
            'longitude': payload['location']['longitude'],
            'distance_km': distance_km,
            'pet_ids': payload.get('pet_ids', []),
            'created_at': created_at.isoformat(),
            'payment_deadline_at': payment_deadline(created_at).isoformat(),
            'payment_paid_at': None,
            'accepted_at': None,
            'contacts_unlocked_at': None,
            'service_started_at': None,
            'service_completed_at': None,
            'completed_at': None,
            'cancelled_at': None,
            'cancelled_by': None,
            'cancel_reason': None,
            'owner_cancel_penalty': 0,
            'pricing': pricing,
            'review': payload.get('review'),
        }
        self._data['orders'].insert(0, order)
        return self._serialize_order(order)

    def pay_order(self, order_id: int) -> dict:
        self._expire_unpaid_orders()
        order = self._find_order(order_id)
        if order['status'] != 'pending_payment':
            raise ValueError('Only pending_payment orders can be paid')
        current_time = datetime.now()
        order['status'] = 'pending'
        order['payment_paid_at'] = current_time.isoformat()
        return self._serialize_order(order)

    def accept_order(self, order_id: int, sitter_id: int) -> dict:
        self._expire_unpaid_orders()
        order = self._find_order(order_id)
        if order['status'] != 'pending':
            raise ValueError('Only pending orders can be accepted')
        current_time = datetime.now()
        order['status'] = 'pending_service'
        order['sitter_id'] = sitter_id
        order['accepted_at'] = current_time.isoformat()
        order['contacts_unlocked_at'] = current_time.isoformat()
        return self._serialize_order(order)

    def start_service(self, order_id: int) -> dict:
        order = self._find_order(order_id)
        if order['status'] != 'pending_service':
            raise ValueError('Only pending_service orders can start service')
        order['status'] = 'in_service'
        order['service_started_at'] = datetime.now().isoformat()
        return self._serialize_order(order)

    def complete_service(self, order_id: int) -> dict:
        order = self._find_order(order_id)
        if order['status'] != 'in_service':
            raise ValueError('Only in_service orders can be completed')
        order['status'] = 'pending_confirmation'
        order['service_completed_at'] = datetime.now().isoformat()
        return self._serialize_order(order)

    def confirm_order(self, order_id: int, rating: int, content: str, reviewer_name: str) -> dict:
        order = self._find_order(order_id)
        if order['status'] != 'pending_confirmation':
            raise ValueError('Only pending_confirmation orders can be confirmed')
        current_time = datetime.now()
        order['status'] = 'completed'
        order['completed_at'] = current_time.isoformat()
        order['review'] = {
            'rating': rating,
            'content': content,
            'reviewer_name': reviewer_name,
            'created_at': current_time.isoformat(),
        }
        return self._serialize_order(order)

    def appeal_order(self, order_id: int, reason: str) -> dict:
        order = self._find_order(order_id)
        if order['status'] != 'pending_confirmation':
            raise ValueError('Only pending_confirmation orders can be appealed')
        order['status'] = 'appealing'
        order['cancel_reason'] = reason
        return self._serialize_order(order)

    def refund_order(self, order_id: int, reason: str) -> dict:
        order = self._find_order(order_id)
        if order['status'] not in {'pending_confirmation', 'appealing'}:
            raise ValueError('Only pending_confirmation or appealing orders can request refund')
        order['status'] = 'refunding'
        order['cancel_reason'] = reason
        return self._serialize_order(order)

    def cancel_order(self, order_id: int, cancelled_by: str, reason: str | None = None) -> dict:
        self._expire_unpaid_orders()
        order = self._find_order(order_id)
        if order['status'] in {'completed', 'cancelled'}:
            raise ValueError('Completed or cancelled orders cannot be cancelled again')
        order['status'] = 'cancelled'
        order['cancelled_at'] = datetime.now().isoformat()
        order['cancelled_by'] = cancelled_by
        order['cancel_reason'] = reason or '订单已取消'
        if cancelled_by == 'owner' and order.get('accepted_at'):
            order['owner_cancel_penalty'] = max(order.get('owner_cancel_penalty', 0), 5)
        return self._serialize_order(order)

    def home_overview(self, user_id: int = 1) -> dict:
        self._expire_unpaid_orders()
        user = self.get_user(user_id)
        posts = self.list_posts()[:3]
        nearby = self.nearby_orders(user['location']['latitude'], user['location']['longitude'], 5)
        stats = {
            'active_sitters': len([item for item in self._data['users'] if item['role'] == 'sitter']),
            'pending_orders': len([item for item in self._data['orders'] if item['status'] == 'pending']),
            'community_posts': len(self._data['posts']),
            'completed_orders': sum(item.get('completed_orders', 0) for item in self._data['users']),
        }
        return {
            'user': user,
            'stats': stats,
            'nearby_orders': nearby,
            'posts': posts,
        }


store = MockStore()
