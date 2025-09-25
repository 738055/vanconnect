// supabase/functions/stripe-webhook/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.31.0';
import Stripe from 'https://esm.sh/stripe@12.12.0?target=deno';

const stripe = Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
  httpClient: Stripe.createFetchHttpClient(),
});
const cryptoProvider = Stripe.createSubtleCryptoProvider();

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  const signature = req.headers.get("Stripe-Signature");
  const body = await req.text();
  
  try {
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      Deno.env.get("STRIPE_WEBHOOK_SIGNING_SECRET")!,
      undefined,
      cryptoProvider
    );

    if (event.type === 'payment_intent.succeeded') {
      const intent = event.data.object;
      const participationId = intent.metadata.participation_id;

      // Atualiza a participação para 'confirmed'
      const { error: updateError } = await supabaseAdmin
        .from('transfer_participations')
        .update({ status: 'confirmed' })
        .eq('id', participationId);
      if (updateError) throw updateError;
      
      // Busca dados para criar a transação e atualizar saldo
      const { data: participation, error: pError } = await supabaseAdmin
        .from('transfer_participations').select('*, transfers(creator_id)').eq('id', participationId).single();
      if(pError) throw pError;
      
      const providerAmount = intent.amount - intent.application_fee_amount;

      // Adiciona ao saldo do provedor
      await supabaseAdmin.rpc('increment_balance', { user_id_in: participation.transfers.creator_id, amount_in: providerAmount / 100 });
      
      // Cria registro de transação para o provedor
      await supabaseAdmin.from('transactions').insert({
        user_id: participation.transfers.creator_id,
        participation_id: participationId,
        type: 'payment',
        amount: providerAmount / 100,
        description: `Recebimento por transfer #${participation.transfer_id}`,
        stripe_charge_id: intent.id
      });
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (err) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }
});