import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js";

serve(async (req) => {
  try {
    const { toUserId } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const {
      data: { user },
    } = await supabase.auth.getUser(req.headers.get("Authorization")!);

    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    if (user.id === toUserId) {
      return new Response("Cannot connect to yourself", { status: 400 });
    }

    // Rate limit check
    const { data: limitData } = await supabase
      .from("rate_limits")
      .select("*")
      .eq("user_id", user.id)
      .eq("action", "connect")
      .maybeSingle();

    if (limitData && limitData.count >= 10) {
      return new Response("Daily limit reached", { status: 429 });
    }

    await supabase.from("rate_limits").upsert({
      user_id: user.id,
      action: "connect",
      count: (limitData?.count || 0) + 1,
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
