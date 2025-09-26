import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Responde a pedidos de verificação CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Dados falsos que simulam uma resposta de sucesso da Stripe
    const mockPixData = {
      pixQrCodeUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/QR_code_for_mobile_English_Wikipedia.svg/1200px-QR_code_for_mobile_English_Wikipedia.svg.png', // URL de um QR Code de exemplo
      pixCode: '00020126580014br.gov.bcb.pix0136123e4567-e89b-12d3-a456-4266554400005204000053039865802BR5913Fake User Name6009SAO PAULO62070503***6304E2B1',
    }

    // Atraso de 1 segundo para simular o tempo de resposta da rede
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Retorna os dados falsos com sucesso
    return new Response(JSON.stringify(mockPixData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
      status: 200
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500 
    })
  }
})