// Em: supabase/functions/stripe-webhook/index.ts

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@12.5.0'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.22.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
  apiVersion: '2022-11-15',
  httpClient: Stripe.createFetchHttpClient(),
})

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

serve(async (req) => {
  const signature = req.headers.get('Stripe-Signature')
  const body = await req.text()
  
  try {
    const event = await stripe.webhooks.constructEvent(
      body,
      signature!,
      Deno.env.get('STRIPE_WEBHOOK_SIGNING_SECRET')!
    )

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      const participationId = paymentIntent.metadata.participation_id

      if (!participationId) {
        throw new Error('Metadata "participation_id" não encontrada no Payment Intent.')
      }

      const { error } = await supabaseAdmin.rpc('handle_successful_payment', {
        p_participation_id: parseInt(participationId),
        p_stripe_payment_intent_id: paymentIntent.id
      })
      
      if (error) throw error
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 })
  } catch (err) {
    console.error('Erro no webhook do Stripe:', err)
    return new Response(JSON.stringify({ error: err.message }), { status: 400 })
  }
})