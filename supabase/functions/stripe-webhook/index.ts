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

// O segredo do endpoint do webhook, que você configura no painel da Stripe
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SIGNING_SECRET') as string;

serve(async (req) => {
  const signature = req.headers.get('Stripe-Signature');
  const body = await req.text();
  let event;

  try {
    // 1. Verifica a assinatura para garantir que a requisição veio da Stripe
    event = await stripe.webhooks.constructEventAsync(body, signature!, webhookSecret);
  } catch (err) {
    console.error(`Falha na verificação da assinatura do webhook: ${err.message}`);
    return new Response(err.message, { status: 400 });
  }

  // 2. Extrai os dados do evento de pagamento
  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  
  try {
    // 3. Processa apenas o evento de 'pagamento bem-sucedido'
    if (event.type === 'payment_intent.succeeded') {
      const { transfer_id, participant_id, seats_requested, passengers } = paymentIntent.metadata;

      // 4. Cria o registo da participação na sua tabela
      const { data: participation, error: participationError } = await supabaseAdmin
        .from('transfer_participations')
        .insert({
          transfer_id: Number(transfer_id),
          participant_id: participant_id,
          seats_requested: Number(seats_requested),
          total_price: paymentIntent.amount / 100,
          status: 'paid', // O status já é 'pago'
          stripe_payment_intent_id: paymentIntent.id,
        })
        .select('id')
        .single();

      if (participationError) {
        throw new Error(`Erro ao criar participação: ${participationError.message}`);
      }

      // 5. ✅ PREPARA E INSERE OS DADOS COMPLETOS DOS PASSAGEIROS
      const passengerData = JSON.parse(passengers).map((p: any) => ({
        participation_id: participation.id,
        full_name: p.full_name,
        document_number: p.document_number,
        hotel_address: p.hotel_address, // Novo campo
        flight_info: p.flight_info      // Novo campo
      }));
      
      const { error: passengerError } = await supabaseAdmin.from('passengers').insert(passengerData);
      if (passengerError) {
        throw new Error(`Erro ao inserir passageiros: ${passengerError.message}`);
      }

      // 6. Atualiza o número de vagas ocupadas no transfer
      const { error: rpcError } = await supabaseAdmin.rpc('increment_occupied_seats', {
        transfer_id_param: Number(transfer_id),
        seats_to_add: Number(seats_requested)
      });
      if (rpcError) {
        throw new Error(`Erro ao atualizar vagas: ${rpcError.message}`);
      }
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (error) {
    console.error('Erro ao processar o webhook:', error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});