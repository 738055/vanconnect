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
    const authHeader = req.headers.get('Authorization')!
    const jwt = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(jwt)

    if (userError) throw userError
    if (!user) throw new Error('Utilizador não encontrado a partir do token.')

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('stripe_account_id')
      .eq('id', user.id)
      .single()
    if (profileError) throw new Error(`Perfil do utilizador não encontrado: ${profileError.message}`)

    let accountId = profile.stripe_account_id;
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'BR',
        email: user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });
      accountId = account.id;
      await supabaseAdmin.from('profiles').update({ stripe_account_id: accountId }).eq('id', user.id)
    }

    const refreshUrl = `${Deno.env.get('SITE_URL')}/onboarding-failed`;
    const returnUrl = `${Deno.env.get('SITE_URL')}/onboarding-complete`;

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding',
    });

    return new Response(JSON.stringify({ url: accountLink.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
      status: 200
    });
  } catch (error) {
    console.error('Erro na função create-stripe-account-link:', error.message);
    return new Response(JSON.stringify({ error: error.message }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
      status: 500 
    });
  }
})