CREATE UNIQUE INDEX one_active_visit_per_patient ON visits(account_id,patient_id) WHERE state IN ('waiting','in_consultation');
CREATE FUNCTION protect_signed_note() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF OLD.state='signed' THEN RAISE EXCEPTION 'Signed notes must be amended, not changed'; END IF; RETURN NEW; END $$;
CREATE TRIGGER signed_note_guard BEFORE UPDATE OR DELETE ON notes FOR EACH ROW EXECUTE FUNCTION protect_signed_note();
