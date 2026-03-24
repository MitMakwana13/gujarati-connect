import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js";

serve(async (req) => {
  try {
    const { toUserId } = await req.json();

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

    if (authError || !user) {
      return new Response("Unauthorized", { status: 401 });
    }

    if (user.id === toUserId) {
      return new Response("Cannot connect to yourself", { status: 400 });
    }

    // Blocked check
    const { data: blocked } = await supabase
      .from("user_blocks")
      .select("*")
      .or(`blocker_id.eq.${user.id},blocked_id.eq.${user.id}`)
      .eq("blocked_id", toUserId)
      .maybeSingle();

    if (blocked) {
      return new Response("User blocked", { status: 403 });
    }

    // Rate limit check
    const { data: limitData } = await supabase
      .from("rate_limits")
      .select("*")
      .eq("user_id", user.id)
      .eq("action", "connect")
      .maybeSingle();

    const now = new Date();
    let currentCount = limitData?.count || 0;
    
    if (limitData?.last_reset) {
      const lastReset = new Date(limitData.last_reset);
      if (now.getDate() !== lastReset.getDate()) {
        currentCount = 0; // reset daily
      }
    }

    if (currentCount >= 10) {
      return new Response("Daily limit reached", { status: 429 });
    }

    await supabase.from("rate_limits").upsert({
      user_id: user.id,
      action: "connect",
      count: currentCount + 1,
      last_reset: now.toISOString(),
    });

    const { data: existing } = await supabase
      .from("connection_requests")
      .select("*")
      .eq("requester_id", user.id)
      .eq("addressee_id", toUserId)
      .maybeSingle();

    if (existing) {
      return new Response("Request already sent", { status: 400 });
    }

    await supabase.from("connection_requests").insert({
      requester_id: user.id,
      addressee_id: toUserId,
      status: "pending",
    });

    await supabase.from("notifications").insert({
      user_id: toUserId,
      type: "request",
      title: "New Connection Request",
      body: "Someone wants to connect with you",
    });

    return new Response(JSON.stringify({ success: true }));
  } catch (err: any) {
    return new Response(err.message, { status: 500 });
  }
});
