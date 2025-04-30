
-- Create a function to search users by email
-- This will be deployed to Supabase
CREATE OR REPLACE FUNCTION search_users_by_email(email_query text)
RETURNS TABLE (
  id uuid,
  email text,
  user_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT au.id, au.email, au.id as user_id
  FROM auth.users au
  WHERE au.email ILIKE '%' || email_query || '%';
END;
$$;

-- Grant execute permissions to authenticated and anon users
GRANT EXECUTE ON FUNCTION search_users_by_email(text) TO authenticated, anon;
