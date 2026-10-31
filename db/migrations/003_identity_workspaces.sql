-- Additive: existing account/principal and clinical record IDs remain unchanged.
-- Existing credentials are NOT merged or linked by an unverified email match.
CREATE TABLE identities (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), email text NOT NULL UNIQUE,
 name text NOT NULL, password_hash text, verified_at timestamptz,
 intent text CHECK(intent IN ('personal','clinic')), auth_version integer NOT NULL DEFAULT 1,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE authentication_methods (
 identity_id uuid NOT NULL REFERENCES identities(id), provider text NOT NULL,
 subject text NOT NULL, PRIMARY KEY(provider,subject), UNIQUE(identity_id,provider)
);
ALTER TABLE principals ADD COLUMN identity_id uuid REFERENCES identities(id);
CREATE UNIQUE INDEX membership_identity ON principals(account_id,identity_id) WHERE identity_id IS NOT NULL;
ALTER TABLE accounts ADD COLUMN country text;
ALTER TABLE accounts ADD COLUMN currency text;
ALTER TABLE accounts ADD COLUMN converted_at timestamptz;
CREATE TABLE workspace_addresses(slug text PRIMARY KEY, account_id uuid NOT NULL REFERENCES accounts(id), is_canonical boolean NOT NULL DEFAULT true);
CREATE UNIQUE INDEX canonical_address ON workspace_addresses(account_id) WHERE is_canonical;
INSERT INTO workspace_addresses(slug,account_id) SELECT slug,id FROM accounts;
CREATE TABLE identity_tokens (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), identity_id uuid NOT NULL REFERENCES identities(id),
 purpose text NOT NULL CHECK(purpose IN ('verify','reset')), token_hash text NOT NULL UNIQUE,
 expires_at timestamptz NOT NULL, consumed_at timestamptz
);
CREATE TABLE workspace_commands (
 identity_id uuid NOT NULL REFERENCES identities(id), operation text NOT NULL, key uuid NOT NULL,
 payload_hash text NOT NULL, account_id uuid NOT NULL REFERENCES accounts(id),
 PRIMARY KEY(identity_id,operation,key)
);
CREATE TABLE invitations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), account_id uuid NOT NULL REFERENCES accounts(id),
 email text NOT NULL, name text NOT NULL DEFAULT '', title text NOT NULL DEFAULT '',
 capabilities text[] NOT NULL, token_hash text NOT NULL UNIQUE,
 state text NOT NULL DEFAULT 'pending' CHECK(state IN ('pending','accepted','revoked')),
 expires_at timestamptz NOT NULL, invited_by uuid NOT NULL,
 accepted_by uuid REFERENCES identities(id), delivered_at timestamptz,
 FOREIGN KEY(account_id,invited_by) REFERENCES principals(account_id,id)
);
CREATE UNIQUE INDEX pending_invitation_email ON invitations(account_id,email) WHERE state='pending';
ALTER TABLE tasks ALTER COLUMN owner_id DROP NOT NULL;
ALTER TABLE tasks ADD COLUMN created_by uuid;
UPDATE tasks SET created_by=owner_id;
ALTER TABLE tasks ADD FOREIGN KEY(account_id,created_by) REFERENCES principals(account_id,id);
ALTER TABLE visits ALTER COLUMN responsible_id DROP NOT NULL;
ALTER TABLE visits ADD COLUMN created_by uuid;
UPDATE visits SET created_by=responsible_id;
ALTER TABLE visits ADD FOREIGN KEY(account_id,created_by) REFERENCES principals(account_id,id);
