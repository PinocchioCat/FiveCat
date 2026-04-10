from fastapi import APIRouter

from app.api.routes import auth, home, orders, posts, support, users

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(home.router, prefix="/home", tags=["home"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(orders.router, prefix="/orders", tags=["orders"])
api_router.include_router(posts.router, prefix="/posts", tags=["posts"])
api_router.include_router(support.router, prefix="/support", tags=["support"])
