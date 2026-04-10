CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('owner', 'sitter')),
    avatar VARCHAR(255),
    bio TEXT,
    phone VARCHAR(20) UNIQUE,
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    rating NUMERIC(2, 1) DEFAULT 5.0,
    completed_orders INTEGER DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_location ON users USING GIST (location);

CREATE TABLE IF NOT EXISTS pets (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(30) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('cat', 'dog', 'other')),
    breed VARCHAR(50),
    age INTEGER,
    photos JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
    id BIGSERIAL PRIMARY KEY,
    owner_id BIGINT NOT NULL REFERENCES users(id),
    sitter_id BIGINT REFERENCES users(id),
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'taken', 'done', 'cancelled')),
    service_type VARCHAR(30) NOT NULL,
    title VARCHAR(80) NOT NULL,
    description TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    service_time TIMESTAMP NOT NULL,
    duration_minutes INTEGER NOT NULL,
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    pet_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_location ON orders USING GIST (location);

CREATE TABLE IF NOT EXISTS posts (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    media_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
    like_count INTEGER NOT NULL DEFAULT 0,
    tags JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reviews (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE VIEW nearby_pending_orders AS
SELECT
    id,
    owner_id,
    sitter_id,
    status,
    service_type,
    title,
    description,
    price,
    service_time,
    duration_minutes,
    created_at
FROM orders
WHERE status = 'pending';
