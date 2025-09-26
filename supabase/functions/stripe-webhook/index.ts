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

const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SIGNING_SECRET') as string;

serve(async (req) => {
  const signature = req.headers.get('Stripe-Signature');
  const body = await req.text();
  let event;

  try {
    event = await stripe.webhooks.constructEventAsync(body, signature!, webhookSecret);
  } catch (err) {
    return new Response(err.message, { status: 400 });
  }

  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  
  try {
    if (event.type === 'payment_intent.succeeded') {
      const { transfer_id, participant_id, seats_requested, passengers } = paymentIntent.metadata;

      // ... (toda a sua lógica existente de criar participação, passageiros e atualizar vagas)
      const { data: participation, error: pError } = await supabaseAdmin.from('transfer_participations').insert({ /*...*/ }).select('id').single();
      if (pError) throw pError;
      
      const passengerData = JSON.parse(passengers).map((p: any) => ({ /*...*/ }));
      const { error: passError } = await supabaseAdmin.from('passengers').insert(passengerData);
      if (passError) throw passError;
      
      const { error: rpcError } = await supabaseAdmin.rpc('increment_occupied_seats', { /*...*/ });
      if (rpcError) throw rpcError;

      // ✅ NOVO: Lógica para Enviar a Notificação Push
      // 1. Busca o perfil do participante para obter o push_token
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('push_token')
        .eq('id', participant_id)
        .single();

      // 2. Se houver um token, chama a função de envio de notificação
      if (profile?.push_token) {
        await supabaseAdmin.functions.invoke('send-push-notification', {
          body: {
            token: profile.push_token,
            title: 'Pagamento Confirmado! 🎉',
            body: `A sua reserva para ${seats_requested} vaga(s) foi confirmada com sucesso.`,
            data: { transfer_id: Number(transfer_id) } // Para o utilizador navegar para o transfer
          }
        });
      }
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (error) {
    console.error('Erro ao processar o webhook:', error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});