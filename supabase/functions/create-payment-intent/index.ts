/ supabase/functions/create-payment-intent/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.31.0';
import Stripe from 'https://esm.sh/stripe@12.12.0?target=deno';
import { corsHeaders } from '../cors.ts';

const stripe = Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
  httpClient: Stripe.createFetchHttpClient(),
});

const APP_FEE_PERCENTAGE = 0.10; // 10% de taxa para o aplicativo

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { transferId, seats, passengers } = await req.json();
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) throw new Error('User not found');

    const { data: transfer, error: transferError } = await supabaseClient
      .from('transfers').select('*, profiles!creator_id(stripe_account_id)').eq('id', transferId).single();
    if (transferError) throw transferError;
    
    const providerStripeId = transfer.profiles.stripe_account_id;
    if (!providerStripeId) throw new Error("Provider has not connected their Stripe account.");

    const totalPrice = transfer.price_per_seat * seats;
    const amountInCents = Math.round(totalPrice * 100);
    const appFeeInCents = Math.round(amountInCents * APP_FEE_PERCENTAGE);

    // Cria a participação com status 'pending_payment'
    const { data: participation, error: participationError } = await supabaseClient
      .from('transfer_participations')
      .insert({
        transfer_id: transferId,
        participant_id: user.id,
        seats_requested: seats,
        total_price: totalPrice,
        status: 'pending_payment',
      }).select().single();
    if (participationError) throw participationError;

    // Adiciona os passageiros
    const passengerData = passengers.map(p => ({ ...p, participation_id: participation.id }));
    const { error: passengerError } = await supabaseClient.from('passengers').insert(passengerData);
    if(passengerError) throw passengerError;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'brl',
      payment_method_types: ['pix'],
      application_fee_amount: appFeeInCents,
      transfer_data: {
        destination: providerStripeId,
      },
      metadata: {
        participation_id: participation.id,
        transfer_id: transferId
      }
    });

    await supabaseClient.from('transfer_participations')
        .update({ stripe_payment_intent_id: paymentIntent.id }).eq('id', participation.id);

    return new Response(JSON.stringify({ clientSecret: paymentIntent.client_secret }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});