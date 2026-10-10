CREATE TABLE IF NOT EXISTS users (
 id UUID PRIMARY KEY, email TEXT UNIQUE NOT NULL, name TEXT NOT NULL,
 password_hash TEXT NOT NULL, objective TEXT, created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE IF NOT EXISTS sessions (
 id UUID PRIMARY KEY, user_id UUID NOT NULL REFERENCES users(id),
 token_hash TEXT NOT NULL UNIQUE, expires_at TIMESTAMPTZ NOT NULL
);
CREATE TABLE IF NOT EXISTS budgets (
 user_id UUID REFERENCES users(id), month TEXT NOT NULL,
 income BIGINT NOT NULL CHECK(income>=0), fixed BIGINT NOT NULL CHECK(fixed>=0),
 saving BIGINT NOT NULL CHECK(saving>=0), closed BOOLEAN NOT NULL DEFAULT false,
 CHECK(fixed+saving<=income), PRIMARY KEY(user_id,month)
);
CREATE TABLE IF NOT EXISTS expenses (
 id UUID PRIMARY KEY, user_id UUID NOT NULL REFERENCES users(id),
 month TEXT NOT NULL, amount BIGINT NOT NULL CHECK(amount>0),
 category TEXT NOT NULL CHECK(category IN ('Supervivencia','Ocio','Cultura','Extras')),
 description TEXT NOT NULL, date DATE NOT NULL, created_at TIMESTAMPTZ DEFAULT now(),
 FOREIGN KEY(user_id,month) REFERENCES budgets(user_id,month)
);
CREATE INDEX IF NOT EXISTS expenses_owner_month ON expenses(user_id,month);
CREATE TABLE IF NOT EXISTS goals (
 id UUID PRIMARY KEY, user_id UUID NOT NULL REFERENCES users(id), name TEXT NOT NULL,
 target BIGINT NOT NULL CHECK(target>0), saved BIGINT NOT NULL DEFAULT 0 CHECK(saved>=0),
 monthly BIGINT NOT NULL CHECK(monthly>0), CHECK(saved<=target)
);
CREATE TABLE IF NOT EXISTS outbox (
 id UUID PRIMARY KEY, user_id UUID NOT NULL REFERENCES users(id), kind TEXT NOT NULL,
 payload JSONB NOT NULL, created_at TIMESTAMPTZ DEFAULT now(), delivered_at TIMESTAMPTZ
);
