// Em: supabase/functions/create-payment-intent/index.ts

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
  try {
    const { amount, transfer_creator_id, metadata } = await req.json()

    const { data: creatorProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('stripe_account_id')
      .eq('id', transfer_creator_id)
      .single()

    if (profileError || !creatorProfile?.stripe_account_id) {
      throw new Error('A conta de pagamento do motorista destino não foi encontrada.')
    }

    const applicationFeeAmount = Math.round(amount * 0.15) // A sua comissão de 15%

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: 'brl',
      payment_method_types: ['pix', 'card'],
      application_fee_amount: applicationFeeAmount,
      transfer_data: {
        destination: creatorProfile.stripe_account_id,
      },
      metadata: metadata, // Passa os metadados (ex: participation_id)
    })
    
    return new Response(JSON.stringify({ client_secret: paymentIntent.client_secret }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})