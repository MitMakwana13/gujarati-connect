// supabase/functions/moderate-post/index.ts
// Supabase Edge Function — text-only moderation (image screening skipped).
// Trigger: Database Webhook on INSERT to public.posts
//
// Env vars (Supabase Dashboard → Edge Functions → Secrets):
//   SUPABASE_URL              — auto-provided
//   SUPABASE_SERVICE_ROLE_KEY — auto-provided
//   BANNED_WORDS              — optional extra comma-separated words

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const DEFAULT_BANNED = [
  'spam','scam','xxx','porn','nude','drugs','kill','rape',
  'terrorist','bomb','hack','phishing','abuse',
];

const BANNED_WORDS: string[] = [
  ...DEFAULT_BANNED,
  ...(Deno.env.get('BANNED_WORDS') ?? '')
    .split(',').map((w: string) => w.trim().toLowerCase()).filter(Boolean),
];

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

Deno.serve(async (req: Request) => {
  try {
    const payload = await req.json();
    const post = payload.record;
    if (!post?.id) return new Response('No record', { status: 400 });

    const lower = (post.content ?? '').toLowerCase();
    const hit = BANNED_WORDS.find((w: string) => lower.includes(w));

    if (hit) {
      const flagReason = 'banned_word:' + hit;

      await supabase
        .from('posts')
        .update({ is_flagged: true, flag_reason: flagReason })
        .eq('id', post.id);

      await supabase.from('reports').insert({
        reporter_id: post.author_id,
        content_type: 'post',
        content_id: post.id,
        reason: 'other',
        details: 'Auto-flagged: ' + flagReason,
        is_auto_flagged: true,
      });

      console.log('[moderation] Post ' + post.id + ' auto-flagged: ' + flagReason);
      return new Response(
        JSON.stringify({ flagged: true, reason: flagReason }),
        { headers: { 'Content-Type': 'application/json' } },
      );
    }

    return new Response(
      JSON.stringify({ flagged: false }),
      { headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err: unknown) {
    console.error('[moderation] Error:', err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
