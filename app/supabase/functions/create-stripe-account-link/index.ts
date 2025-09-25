// Em: supabase/functions/create-stripe-account-link/index.ts

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.22.0'
import Stripe from 'https://esm.sh/stripe@12.5.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
  apiVersion: '2022-11-15',
  httpClient: Stripe.createFetchHttpClient(),
})

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_ANON_KEY') ?? '',
)

serve(async (req) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return new Response(JSON.stringify({ error: 'Utilizador não autenticado' }), { status: 401 })
  }

  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_account_id')
      .eq('id', user.id)
      .single()

    if (profileError) throw profileError

    let accountId = profile.stripe_account_id
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'BR',
        email: user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      })
      accountId = account.id
      await supabase.from('profiles').update({ stripe_account_id: accountId }).eq('id', user.id)
    }

    const refreshUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/get-stripe-account-status`
    const returnUrl = `${Deno.env.get('SITE_URL')}/onboarding-complete` // URL da sua app para onde o utilizador volta

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding',
    })

    return new Response(JSON.stringify({ url: accountLink.url }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Erro ao criar link da conta Stripe:', error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})