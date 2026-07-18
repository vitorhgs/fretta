import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email, senha, motorista_id, nome } = await req.json();

    if (!email || !senha || !motorista_id) {
      return new Response(
        JSON.stringify({ error: "Dados incompletos" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } =
      await supabaseAdmin.auth.getUser(token);

    if (userError || !userData.user) {
      return new Response(
        JSON.stringify({ error: "Token inválido" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: adminData } = await supabaseAdmin
      .from("usuarios")
      .select("empresa_id, role")
      .eq("id", userData.user.id)
      .single();

    if (!adminData || !["owner", "admin"].includes(adminData.role)) {
      return new Response(
        JSON.stringify({ error: "Sem permissão" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: motoristaData } = await supabaseAdmin
      .from("motoristas")
      .select("empresa_id")
      .eq("id", motorista_id)
      .single();

    if (
      !motoristaData ||
      motoristaData.empresa_id !== adminData.empresa_id
    ) {
      return new Response(
        JSON.stringify({ error: "Motorista não pertence à sua empresa" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: novoUsuario, error: erroCriar } =
      await supabaseAdmin.auth.admin.createUser({
        email: email.trim().toLowerCase(),
        password: senha,
        email_confirm: true,
        user_metadata: {
          nome: nome,
          tipo: "motorista",
        },
      });

    if (erroCriar) {
      return new Response(
        JSON.stringify({ error: erroCriar.message }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { error: erroVinculo } = await supabaseAdmin
      .from("motoristas")
      .update({
        auth_user_id: novoUsuario.user.id,
        email: email.trim().toLowerCase(),
      })
      .eq("id", motorista_id);

    if (erroVinculo) {
      await supabaseAdmin.auth.admin.deleteUser(novoUsuario.user.id);
      return new Response(
        JSON.stringify({ error: "Erro ao vincular ao motorista" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        user_id: novoUsuario.user.id,
        email: email,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Erro:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});