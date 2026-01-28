import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const SoporteDialog = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="hover:text-primary transition-colors">Soporte</button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>Centro de Soporte</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[calc(85vh-8rem)] pr-4">
          <div className="space-y-6 text-sm">
            <section>
              <h3 className="font-semibold text-lg mb-4">Preguntas Frecuentes (FAQ)</h3>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger>¿Cómo funciona Bakan?</AccordionTrigger>
                  <AccordionContent>
                    Bakan actúa como intermediario de confianza. Cuando haces una compra, el dinero se retiene de forma segura hasta que confirmes que recibiste el producto en perfectas condiciones. Solo entonces liberamos el pago al vendedor, protegiendo a ambas partes.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2">
                  <AccordionTrigger>¿Cuánto cobra Bakan?</AccordionTrigger>
                  <AccordionContent>
                    Para compradores: Pagas el precio del producto + una comisión de seguridad del 3% + S/ 1.00 que garantiza la protección de tu compra.
                    <br />
                    Para vendedores: Recibes el precio completo del producto. ¡Sin descuentos ni comisiones!
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3">
                  <AccordionTrigger>¿Qué hago si no recibo mi producto?</AccordionTrigger>
                  <AccordionContent>
                    Si no recibes el producto en el plazo acordado, puedes iniciar una disputa desde tu panel de transacciones. Nuestro equipo revisará el caso y, si corresponde, te reembolsaremos el 100% de tu dinero. Recuerda que tienes 48 horas desde la supuesta entrega para reportar cualquier problema.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4">
                  <AccordionTrigger>¿El producto llegó dañado, qué hago?</AccordionTrigger>
                  <AccordionContent>
                    Es crucial que grabes un video continuo (sin cortes) del unboxing desde que recibes el paquete, mostrando la etiqueta de envío y el estado del producto. Esta evidencia es fundamental para resolver tu disputa favorablemente. Inicia una disputa inmediatamente y adjunta el video.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-5">
                  <AccordionTrigger>¿Cuándo recibo mi dinero como vendedor?</AccordionTrigger>
                  <AccordionContent>
                    Recibes tu pago una vez que el comprador confirma haber recibido el producto satisfactoriamente. Para productos físicos, esto suele ocurrir dentro de las 48 horas de entrega. Si el comprador no responde, liberamos el pago automáticamente tras verificar la confirmación de entrega del courier. El dinero se transfiere a tu cuenta bancaria registrada en 1-2 días hábiles.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-6">
                  <AccordionTrigger>¿Cuánto tiempo tengo para confirmar la recepción?</AccordionTrigger>
                  <AccordionContent>
                    Tienes 48 horas desde que el vendedor marca el producto como enviado para revisar que todo esté correcto. Si no confirmas en ese tiempo y hay constancia de entrega del courier, el pago se liberará automáticamente.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-7">
                  <AccordionTrigger>¿Cómo inicio una disputa?</AccordionTrigger>
                  <AccordionContent>
                    Ve a "Mis Transacciones", selecciona la transacción problemática y haz clic en "Iniciar Disputa". Deberás proporcionar evidencia clara del problema (fotos, videos de unboxing, capturas de pantalla). Nuestro equipo de mediación revisará el caso imparcialmente en un plazo de 3-5 días hábiles.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-8">
                  <AccordionTrigger>¿Qué evidencia necesito como vendedor?</AccordionTrigger>
                  <AccordionContent>
                    Para productos físicos: Es altamente recomendable grabar un video continuo del proceso de empaquetado, mostrando el producto en perfectas condiciones, el empaque final y la entrega al courier con la etiqueta visible. También debes subir el número de seguimiento del envío. Esta evidencia es tu mejor protección contra reclamos falsos.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-9">
                  <AccordionTrigger>¿Bakan protege contra estafas?</AccordionTrigger>
                  <AccordionContent>
                    Sí, ese es nuestro propósito principal. Al retener el pago hasta confirmar la entrega exitosa, protegemos a los compradores de vendedores deshonestos y a los vendedores de compradores que reclaman falsos daños. Nuestro sistema de evidencia y mediación está diseñado para detectar estafas. Sin embargo, es crucial que ambas partes sigan las mejores prácticas (grabar unboxing, videos de empaque, etc.).
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-10">
                  <AccordionTrigger>¿Puedo cancelar una transacción?</AccordionTrigger>
                  <AccordionContent>
                    Antes del envío: Sí, ambas partes pueden acordar cancelar y reembolsar el 100%.
                    <br />
                    Después del envío: Solo mediante una disputa formal, que será evaluada por nuestro equipo según las evidencias.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-11">
                  <AccordionTrigger>¿Qué no está permitido vender en Bakan?</AccordionTrigger>
                  <AccordionContent>
                    Prohibimos estrictamente: artículos ilegales, drogas, armas, productos falsificados, animales vivos, contenido pornográfico, servicios sexuales, y cualquier bien obtenido ilícitamente. Violaciones resultan en suspensión permanente y posible reporte a autoridades.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-12">
                  <AccordionTrigger>¿Cómo me contacto con el equipo de Bakan?</AccordionTrigger>
                  <AccordionContent>
                    Email: <a href="mailto:bakanoficial@gmail.com" className="text-primary hover:underline">bakanoficial@gmail.com</a>
                    <br />
                    Respondemos todas las consultas en un plazo de 24-48 horas hábiles.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </section>

            <section className="mt-8 pt-6 border-t">
              <h3 className="font-semibold text-lg mb-3">¿No encontraste respuesta?</h3>
              <p className="text-muted-foreground mb-4">
                Si tu pregunta no está cubierta en las FAQ, nuestro equipo de soporte está aquí para ayudarte.
              </p>
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="font-semibold mb-2">Contáctanos:</p>
                <p className="text-muted-foreground">
                  Email: <a href="mailto:bakanoficial@gmail.com" className="text-primary hover:underline">bakanoficial@gmail.com</a>
                </p>
                <p className="text-muted-foreground mt-2 text-xs">
                  Tiempo de respuesta: 24-48 horas hábiles
                </p>
              </div>
            </section>

            <section className="mt-6">
              <h3 className="font-semibold text-lg mb-3">Consejos de Seguridad</h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Siempre usa Bakan para procesar pagos, nunca hagas transferencias directas</li>
                <li>Graba videos de unboxing y empaquetado para protegerte</li>
                <li>Lee las descripciones de productos cuidadosamente antes de comprar</li>
                <li>Reporta comportamientos sospechosos a nuestro equipo</li>
                <li>Nunca compartas tu contraseña de Bakan con nadie</li>
              </ul>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
