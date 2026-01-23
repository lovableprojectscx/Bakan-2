import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Calculate 48 hours ago
    const cutoffDate = new Date()
    cutoffDate.setHours(cutoffDate.getHours() - 48)
    const cutoffISO = cutoffDate.toISOString()

    console.log(`[expire-transactions] Checking for transactions inactive since: ${cutoffISO}`)

    // Find transactions that are stale (in early states without activity for 48h)
    const staleStates = ['iniciada', 'pendiente_pago']
    
    const { data: staleTransactions, error: fetchError } = await supabase
      .from('transacciones')
      .select('id, titulo, estado, vendedor_id, comprador_id, updated_at')
      .in('estado', staleStates)
      .lt('updated_at', cutoffISO)

    if (fetchError) {
      console.error('[expire-transactions] Error fetching stale transactions:', fetchError)
      throw fetchError
    }

    if (!staleTransactions || staleTransactions.length === 0) {
      console.log('[expire-transactions] No stale transactions found')
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No stale transactions found',
          expired: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`[expire-transactions] Found ${staleTransactions.length} stale transactions`)

    const expiredIds: string[] = []
    const errors: string[] = []

    for (const transaction of staleTransactions) {
      // Update transaction to cancelled state
      const { error: updateError } = await supabase
        .from('transacciones')
        .update({ 
          estado: 'cancelada_automatico',
          updated_at: new Date().toISOString()
        })
        .eq('id', transaction.id)

      if (updateError) {
        console.error(`[expire-transactions] Error updating transaction ${transaction.id}:`, updateError)
        errors.push(transaction.id)
        continue
      }

      expiredIds.push(transaction.id)

      // Send system message to transaction chat
      const systemMessage = `⏰ Esta transacción ha sido cancelada automáticamente por inactividad (más de 48 horas sin cambios). Si deseas continuar, por favor crea una nueva transacción.`
      
      // Use a system user ID or the first available party
      const emisorId = transaction.vendedor_id || transaction.comprador_id
      
      if (emisorId) {
        const { error: messageError } = await supabase
          .from('mensajes')
          .insert({
            transaccion_id: transaction.id,
            emisor_id: emisorId,
            contenido: systemMessage,
            tipo_mensaje: 'sistema_automatico'
          })

        if (messageError) {
          console.error(`[expire-transactions] Error sending message for ${transaction.id}:`, messageError)
        }
      }

      console.log(`[expire-transactions] Expired transaction: ${transaction.id} (${transaction.titulo})`)
    }

    const summary = {
      success: true,
      message: `Expired ${expiredIds.length} transactions`,
      expired: expiredIds.length,
      expiredIds,
      errors: errors.length > 0 ? errors : undefined
    }

    console.log('[expire-transactions] Summary:', summary)

    return new Response(
      JSON.stringify(summary),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('[expire-transactions] Unexpected error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
