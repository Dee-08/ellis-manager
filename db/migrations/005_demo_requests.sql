CREATE TABLE demo_requests (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 command_key uuid NOT NULL UNIQUE,
 payload_hash text NOT NULL,
 name text NOT NULL, email text NOT NULL, phone text NOT NULL DEFAULT '',
 practice_name text NOT NULL DEFAULT '', practice_type text NOT NULL CHECK(practice_type IN ('personal','clinic')),
 timezone text NOT NULL, preferred_time text NOT NULL DEFAULT '', details text NOT NULL DEFAULT '',
 created_at timestamptz NOT NULL DEFAULT now()
);
