import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.22.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { transferId, seatsRequested, passengers, totalPrice } = await req.json();
    
    const authHeader = req.headers.get('Authorization')!
    const jwt = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabaseAdmin.auth.getUser(jwt)
    if (!user) throw new Error('Utilizador não autenticado')

    // A lógica existente para criar a participação, passageiros e atualizar vagas permanece a mesma.
    const { data: participation, error: participationError } = await supabaseAdmin
      .from('transfer_participations')
      .insert({
        transfer_id: transferId,
        participant_id: user.id,
        seats_requested: seatsRequested,
        total_price: totalPrice,
        status: 'paid',
        stripe_payment_intent_id: `mock_${new Date().getTime()}`,
      })
      .select('id')
      .single();
    if (participationError) throw new Error(`Erro ao criar participação simulada: ${participationError.message}`)

    const passengerData = passengers.map((p: any) => ({
      ...p,
      participation_id: participation.id
    }));
    const { error: passengerError } = await supabaseAdmin.from('passengers').insert(passengerData);
    if (passengerError) throw new Error(`Erro ao inserir passageiros simulados: ${passengerError.message}`);

    const { error: rpcError } = await supabaseAdmin.rpc('increment_occupied_seats', {
      p_transfer_id: transferId,
      p_seats_to_add: seatsRequested
    });
    if (rpcError) throw new Error(`Erro ao atualizar vagas simuladas: ${rpcError.message}`);

    // ✅ NOVO: Lógica para Enviar a Notificação para o Motorista
    // 1. Busca os dados do transfer para encontrar o criador e o título
    const { data: transferData } = await supabaseAdmin
        .from('transfers')
        .select('creator_id, transfer_types(title)')
        .eq('id', transferId)
        .single();
    
    // 2. Chama a nova função 'create-notification' para fazer o trabalho
    if (transferData) {
        await supabaseAdmin.functions.invoke('create-notification', {
            body: {
                userId: transferData.creator_id,
                title: 'Nova Reserva Recebida! 🚐',
                body: `${user.user_metadata.full_name || 'Um passageiro'} reservou ${seatsRequested} vaga(s) no seu transfer "${transferData.transfer_types.title}".`,
                data: { transfer_id: transferId } // Dados para navegação
            }
        });
    }

    return new Response(JSON.stringify({ success: true, participationId: participation.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Erro na função confirm-mock-payment:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});