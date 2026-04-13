import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vxqaqoazrlozyhjsqfvv.supabase.co';
const SUPABASE_KEY = 'sb_publishable_ny5UwDDJS8UbVyPGvhmsjw_Y5zZsS64';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
