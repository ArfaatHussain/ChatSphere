import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import {PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_KEY} from "@env";
console.log('Supabase URL:', PUBLIC_SUPABASE_URL);
console.log('Supabase Key:', PUBLIC_SUPABASE_KEY);
export const supabase = createClient(
  PUBLIC_SUPABASE_URL,
  PUBLIC_SUPABASE_KEY
);