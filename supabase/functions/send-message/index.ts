import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js";

serve(async (req) => {
  try {
    const { threadId, text } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const {
      data: { user },
    } = await supabase.auth.getUser(req.headers.get("Authorization")!);

    if (!user) return new Response("Unauthorized", { status: 401 });

    if (!text.trim()) {
      return new Response("Empty message", { status: 400 });
    }

    await supabase.from("messages").insert({
      thread_id: threadId,
      sender_id: user.id,
      body: text,
    });

    return new Response(JSON.stringify({ success: true }));
  } catch (err: any) {
    return new Response(err.message, { status: 500 });
  }
});
