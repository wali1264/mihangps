
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

const supabaseUrl = 'https://hbkcbflzcpeijfkyxzoc.supabase.co';
const supabaseKey = 'sb_publishable_TxMOda-U6S8KDy18Ew_kFw_R3m9mM6q';

export const supabase = createClient(supabaseUrl, supabaseKey);
