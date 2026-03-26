import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

// These will be provided by the user later
const supabaseUrl = 'https://zhditsdqjqkgvgfkfeha.supabase.co';
const supabaseAnonKey = 'sb_publishable_d1mj_m1E8_WFlJqbcvkfAA_fGL2MRGp';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
