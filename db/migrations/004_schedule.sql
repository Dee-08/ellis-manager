CREATE TABLE appointments (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), account_id uuid NOT NULL REFERENCES accounts(id),
 patient_id uuid NOT NULL, clinician_id uuid, created_by uuid NOT NULL,
 reason text NOT NULL, internal_note text NOT NULL DEFAULT '',
 starts_at timestamptz NOT NULL, ends_at timestamptz NOT NULL,
 state text NOT NULL DEFAULT 'booked' CHECK(state IN ('booked','confirmed','arrived','cancelled','no_show')),
 version integer NOT NULL DEFAULT 1, command_key uuid NOT NULL,
 UNIQUE(account_id,id), UNIQUE(account_id,command_key), CHECK(ends_at>starts_at),
 FOREIGN KEY(account_id,patient_id) REFERENCES patients(account_id,id),
 FOREIGN KEY(account_id,clinician_id) REFERENCES principals(account_id,id),
 FOREIGN KEY(account_id,created_by) REFERENCES principals(account_id,id)
);
CREATE INDEX appointments_time ON appointments(account_id,starts_at);
ALTER TABLE visits ADD COLUMN appointment_id uuid;
ALTER TABLE visits ADD FOREIGN KEY(account_id,appointment_id) REFERENCES appointments(account_id,id);
CREATE UNIQUE INDEX visit_appointment ON visits(account_id,appointment_id) WHERE appointment_id IS NOT NULL;
INSERT INTO capability_grants(account_id,principal_id,capability)
 SELECT p.account_id,p.id,c.capability FROM principals p CROSS JOIN (VALUES ('appointment.view'),('appointment.manage')) c(capability) WHERE p.is_owner
 ON CONFLICT DO NOTHING;
