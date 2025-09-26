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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { transferId, seatsRequested, passengers } = await req.json()
    if (!transferId || !seatsRequested || !passengers) {
      throw new Error("Dados da requisição incompletos.")
    }

    const authHeader = req.headers.get('Authorization')!
    const jwt = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(jwt)
    if (userError || !user) throw new Error('Utilizador não autenticado')

    const { data: transfer, error: transferError } = await supabaseAdmin
      .from('transfers')
      .select('price_per_seat, creator_id, total_seats, occupied_seats')
      .eq('id', transferId)
      .single()
    if (transferError) throw new Error('Transfer não encontrado.')

    if ((transfer.total_seats - transfer.occupied_seats) < seatsRequested) {
      throw new Error('Não há vagas suficientes disponíveis.');
    }

    const { data: creatorProfile } = await supabaseAdmin
      .from('profiles')
      .select('stripe_account_id')
      .eq('id', transfer.creator_id)
      .single()
    if (!creatorProfile?.stripe_account_id) throw new Error('Conta de pagamento do motorista não encontrada.')

    const amount = Math.round(transfer.price_per_seat! * seatsRequested * 100);
    const applicationFeeAmount = Math.round(amount * 0.15);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: 'brl',
      payment_method_types: ['pix'],
      application_fee_amount: applicationFeeAmount,
      transfer_data: {
        destination: creatorProfile.stripe_account_id,
      },
      metadata: {
        transfer_id: transferId,
        participant_id: user.id,
        seats_requested: seatsRequested,
        passengers: JSON.stringify(passengers)
      },
    });

    const pixData = paymentIntent.next_action?.pix_display_qr_code;
    if (!pixData) {
      throw new Error('Não foi possível gerar os dados do PIX.');
    }

    return new Response(JSON.stringify({ 
      pixQrCodeUrl: pixData.image_url_png,
      pixCode: pixData.data,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
      status: 200
    });

  } catch (error) {
    console.error('Erro na função create-payment-intent:', error.message)
    return new Response(JSON.stringify({ error: error.message }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500 
    })
  }
})