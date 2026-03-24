import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js";

serve(async (req) => {
  try {
    const { threadId, text } = await req.json();

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response("Missing auth", { status: 401 });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));

    if (authError || !user) return new Response("Unauthorized", { status: 401 });

    if (!text || !text.trim()) {
      return new Response("Empty message", { status: 400 });
    }
    
    // XSS Sanitization
    const cleanText = text.replace(/<[^>]*>?/gm, '').trim();
    if (cleanText.length > 1000) return new Response("Message too long", { status: 400 });

    // Chat Authorization Check
    const { data: participant } = await supabase
      .from("chat_participants")
      .select("*")
      .eq("thread_id", threadId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!participant) {
      return new Response("Not allowed in this thread", { status: 403 });
    }

    await supabase.from("messages").insert({
      thread_id: threadId,
      sender_id: user.id,
      body: cleanText,
    });

    return new Response(JSON.stringify({ success: true }));
  } catch (err: any) {
    return new Response(err.message, { status: 500 });
  }
});
