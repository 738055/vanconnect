// supabase/functions/create-payout/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.31.0';
import Stripe from 'https://esm.sh/stripe@12.12.0?target=deno';
import { corsHeaders } from '../cors.ts';

const stripe = Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
  httpClient: Stripe.createFetchHttpClient(),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { amount } = await req.json();
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) throw new Error('User not found');
    
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles').select('stripe_account_id, balance').eq('id', user.id).single();
    if(profileError) throw profileError;

    if (profile.balance < amount) throw new Error("Insufficient balance.");
    if (!profile.stripe_account_id) throw new Error("Stripe account not connected.");

    // Cria o saque no Stripe
    const transfer = await stripe.transfers.create({
        amount: Math.round(amount * 100),
        currency: 'brl',
        destination: profile.stripe_account_id,
    });
    
    // Insere registro de payout no DB
    const { data: payout, error: payoutError } = await supabaseClient
      .from('payouts').insert({ user_id: user.id, amount, stripe_transfer_id: transfer.id }).select().single();
    if(payoutError) throw payoutError;

    // Debita do saldo
    await supabaseClient.rpc('decrement_balance', { user_id_in: user.id, amount_in: amount });
    
    // Cria transação
    await supabaseClient.from('transactions').insert({
        user_id: user.id,
        type: 'payout',
        amount: -amount,
        description: `Saque solicitado`,
        stripe_charge_id: transfer.id
    });
    
    return new Response(JSON.stringify(payout), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});