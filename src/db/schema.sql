-- For storing polling data of restaurants
CREATE TABLE IF NOT EXISTS store_status (
    id SERIAL PRIMARY KEY,
    store_id VARCHAR NOT NULL,
    timestamp_utc TIMESTAMP NOT NULL,
    status VARCHAR CHECK (status IN ('active', 'inactive'))
);

-- Store business hours
CREATE TABLE IF NOT EXISTS business_hours (
    id SERIAL PRIMARY KEY,
    store_id VARCHAR NOT NULL,
    day_of_week INT CHECK (day_of_week BETWEEN 0 AND 6),
    start_time_local TIME NOT NULL,
    end_time_local TIME NOT NULL
);

-- Store timezone information
CREATE TABLE IF NOT EXISTS store_timezone (
    id SERIAL PRIMARY KEY,
    store_id VARCHAR NOT NULL,
    timezone_str VARCHAR NOT NULL
);
