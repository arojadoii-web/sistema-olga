
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mitfirhbuukicgabcehr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pdGZpcmhidXVraWNnYWJjZWhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4NDI3NzQsImV4cCI6MjA4MTQxODc3NH0.p-tf-8xaaRWVmE9njoUMJvJKBRb7Ufe-CKQ8QTSpIcE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
