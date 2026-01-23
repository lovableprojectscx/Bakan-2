import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PaymentNotificationRequest {
  transaccionId: string;
  monto: number;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transaccionId, monto }: PaymentNotificationRequest = await req.json();
    
    console.log('[Notify Admin] Recibida solicitud para transacción:', transaccionId);

    // Obtener detalles de la transacción
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    const { data: transaccion, error: txError } = await supabase
      .from('transacciones')
      .select('titulo_producto, codigo_invitacion, precio_producto')
      .eq('id', transaccionId)
      .single();

    if (txError) {
      console.error('[Notify Admin] Error obteniendo transacción:', txError);
    }

    const tituloProducto = transaccion?.titulo_producto || 'Producto';
    const codigoInvitacion = transaccion?.codigo_invitacion || 'N/A';
    const precioProducto = transaccion?.precio_producto || monto;

    // Generar URL del panel admin
    const adminUrl = `https://bakan.pe/admin`;

    const emailResponse = await resend.emails.send({
      from: "Bakan <onboarding@resend.dev>",
      to: [ADMIN_EMAIL],
      subject: `🔔 Nuevo pago pendiente de verificación - S/ ${precioProducto.toFixed(2)}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">🔔 Nuevo Pago Pendiente</h1>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
            <p style="font-size: 16px; margin-bottom: 20px;">
              Se ha subido un nuevo voucher de pago que requiere tu verificación.
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; margin-bottom: 20px;">
              <h2 style="margin: 0 0 15px 0; font-size: 18px; color: #374151;">Detalles de la transacción:</h2>
              
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">Producto:</td>
                  <td style="padding: 8px 0; font-weight: 600; text-align: right;">${tituloProducto}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">Código:</td>
                  <td style="padding: 8px 0; font-weight: 600; text-align: right;">${codigoInvitacion}</td>
                </tr>
                <tr style="border-top: 1px solid #e5e7eb;">
                  <td style="padding: 12px 0; color: #6b7280; font-size: 18px;">Monto:</td>
                  <td style="padding: 12px 0; font-weight: 700; text-align: right; font-size: 24px; color: #059669;">S/ ${precioProducto.toFixed(2)}</td>
                </tr>
              </table>
            </div>
            
            <div style="text-align: center;">
              <a href="${adminUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Ir al Panel de Administración
              </a>
            </div>
            
            <p style="margin-top: 20px; font-size: 14px; color: #6b7280; text-align: center;">
              Por favor, verifica el voucher y confirma o rechaza el pago lo antes posible.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
            <p>Este es un mensaje automático de Bakan.</p>
          </div>
        </body>
        </html>
      `,
    });

    console.log("[Notify Admin] Email enviado exitosamente:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("[Notify Admin] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
