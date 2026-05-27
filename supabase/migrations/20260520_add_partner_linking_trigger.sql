-- Create function to handle bidirectional partner linking and unlinking
CREATE OR REPLACE FUNCTION public.handle_partner_linking()
RETURNS trigger AS $$
BEGIN
  -- If partner_id is being set/updated to a new value (paired)
  IF NEW.partner_id IS DISTINCT FROM OLD.partner_id AND NEW.partner_id IS NOT NULL THEN
    -- Update the partner's record to point back to this user, if not already set
    UPDATE public.users
    SET partner_id = NEW.id,
        pairing_code = NULL,
        pairing_code_expires_at = NULL
    WHERE id = NEW.partner_id AND (partner_id IS DISTINCT FROM NEW.id OR partner_id IS NULL);
  END IF;

  -- If partner_id is being cleared (unpaired)
  IF NEW.partner_id IS NULL AND OLD.partner_id IS NOT NULL THEN
    -- Clear the partner's partner_id as well, if they are still pointing to this user
    UPDATE public.users
    SET partner_id = NULL
    WHERE id = OLD.partner_id AND partner_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for users table partner_id updates
DROP TRIGGER IF EXISTS on_partner_id_updated ON public.users;
CREATE TRIGGER on_partner_id_updated
  AFTER UPDATE OF partner_id ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_partner_linking();
