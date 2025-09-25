// Em: supabase/functions/get-stripe-account-status/index.ts

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.22.0'
import Stripe from 'https://esm.sh/stripe@12.5.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
  apiVersion: '2022-11-15',
  httpClient: Stripe.createFetchHttpClient(),
})

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

serve(async (req) => {
  const { data: { user } } = await createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
  ).auth.getUser()

  if (!user) {
    return new Response(JSON.stringify({ error: 'Utilizador não autenticado' }), { status: 401 })
  }

  try {
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('stripe_account_id')
      .eq('id', user.id)
      .single()
    
    if (!profile?.stripe_account_id) throw new Error('ID da conta Stripe não encontrado.')

    const account = await stripe.accounts.retrieve(profile.stripe_account_id)
    const onboardingComplete = account.charges_enabled && account.details_submitted

    await supabaseAdmin
      .from('profiles')
      .update({ stripe_onboarding_complete: onboardingComplete })
      .eq('id', user.id)

    return new Response(JSON.stringify({ onboardingComplete }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})