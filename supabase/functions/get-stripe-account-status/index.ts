import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.22.0'
import Stripe from 'https://esm.sh/stripe@12.5.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
  apiVersion: '2022-11-15',
  httpClient: Stripe.createFetchHttpClient(),
})

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Autentica o utilizador a partir do token JWT
    const authHeader = req.headers.get('Authorization')!
    const jwt = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(jwt)
    if (userError || !user) throw new Error('Utilizador não autenticado')

    // 2. Busca o ID da conta Stripe a partir do perfil do utilizador
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('stripe_account_id')
      .eq('id', user.id)
      .single()
    if (profileError || !profile?.stripe_account_id) {
      throw new Error('Conta Stripe não encontrada no perfil.')
    }

    // 3. Busca os detalhes da conta diretamente na API da Stripe
    const account = await stripe.accounts.retrieve(profile.stripe_account_id)
    const onboardingComplete = account.charges_enabled && account.details_submitted

    // 4. ✅ AÇÃO CRÍTICA: Atualiza o campo 'stripe_onboarding_complete' no Supabase
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ stripe_onboarding_complete: onboardingComplete })
      .eq('id', user.id)
    if (updateError) throw new Error('Falha ao atualizar o status do onboarding no perfil.')

    // 5. Retorna o status de conclusão para a aplicação
    return new Response(JSON.stringify({ onboardingComplete }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Erro ao verificar status da conta Stripe:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})