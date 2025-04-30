
-- Create a function to search users by email
-- This will be deployed to Supabase
create or replace function search_users_by_email(email_query text)
returns table (id uuid, email text)
language plpgsql security definer
as $$
begin
  return query
  select au.id, au.email
  from auth.users au
  where au.email ilike '%' || email_query || '%';
end;
$$;

-- Grant execute permissions to authenticated and anon users
grant execute on function search_users_by_email(text) to authenticated, anon;
