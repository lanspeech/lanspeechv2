import { createClient } from '@supabase/supabase-js';

const [email, password, displayName] = process.argv.slice(2);
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in the environment.');
  process.exit(1);
}

if (!email || !password || !displayName) {
  console.error('Usage: node scripts/create-admin.mjs <email> <password> <display_name>');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function run() {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: displayName },
  });

  if (error) {
    console.error('Failed to create auth user:', error.message);
    process.exit(1);
  }

  const user = data.user;
  if (!user) {
    console.error('Unexpected error: no user returned from Supabase.');
    process.exit(1);
  }

  const { error: profileError } = await supabase.from('profiles').upsert({
    user_id: user.id,
    display_name: displayName,
    is_admin: true,
    subscription_expires_at: null,
  }, { onConflict: 'user_id' });

  if (profileError) {
    console.error('Failed to create profile row:', profileError.message);
    process.exit(1);
  }

  console.log('Admin user created successfully:');
  console.log(`  email: ${email}`);
  console.log(`  password: ${password}`);
  console.log('Be sure to keep the password secure and rotate it after first login if necessary.');
}

run().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
