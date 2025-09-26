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

    // 1. Cria o registo da participação na sua base de dados
    const { data: participation, error: participationError } = await supabaseAdmin
      .from('transfer_participations')
      .insert({
        transfer_id: transferId,
        participant_id: user.id,
        seats_requested: seatsRequested,
        total_price: totalPrice,
        status: 'paid', // Simula o pagamento bem-sucedido
        stripe_payment_intent_id: `mock_${new Date().getTime()}`, // ID simulado
      })
      .select('id')
      .single();
    if (participationError) throw new Error(`Erro ao criar participação simulada: ${participationError.message}`)

    // 2. Adiciona os passageiros associados a essa participação
    const passengerData = passengers.map((p: any) => ({
      ...p,
      participation_id: participation.id
    }));
    const { error: passengerError } = await supabaseAdmin.from('passengers').insert(passengerData);
    if (passengerError) throw new Error(`Erro ao inserir passageiros simulados: ${passengerError.message}`);

    // 3. ✅ CORREÇÃO: Os nomes dos parâmetros foram ajustados para corresponder à base de dados.
    const { error: rpcError } = await supabaseAdmin.rpc('increment_occupied_seats', {
      p_transfer_id: transferId,
      p_seats_to_add: seatsRequested
    });
    if (rpcError) throw new Error(`Erro ao atualizar vagas simuladas: ${rpcError.message}`);

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