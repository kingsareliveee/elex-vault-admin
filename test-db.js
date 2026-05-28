import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://qeydeliinydvyydplbpa.supabase.co";
const supabaseAnonKey = "sb_publishable_v3yx0H-65oWxm2f_IOitNw_bVNqy72F";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  console.log("Fetching a paper...");
  const { data: papers } = await supabase.from('elex_papers').select('id').limit(1);
  const paperId = papers[0].id;

  const authorColumns = [
    'created_by',
    'user_id',
    'admin_id',
    'email',
    'contributor',
    'admin_email',
    'commenter_name',
    'commenter_email',
    'name',
    'admin'
  ];

  for (const col of authorColumns) {
    const obj = { paper_id: paperId, comment: 'Test comment' };
    obj[col] = 'Test Author';
    
    const { data, error } = await supabase
      .from('elex_paper_comments')
      .insert([obj])
      .select();
    
    if (error && error.code === 'PGRST204') {
      console.log(`Column '${col}' does not exist:`, error.message);
    } else {
      console.log(`Column '${col}' exists or other error:`, error ? error.message : 'SUCCESS!');
    }
  }
}

test();
