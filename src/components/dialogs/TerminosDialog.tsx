import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

export const TerminosDialog = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="hover:text-primary transition-colors">Términos</button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>Términos y Condiciones de Servicio de Bakan</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[calc(85vh-8rem)] pr-4">
          <div className="space-y-6 text-sm">
            <p className="text-muted-foreground">Última actualización: 27 de octubre de 2025</p>
            
            <p>
              Bienvenido a Bakan. Al registrarte o utilizar nuestros servicios (el "Servicio"), aceptas haber leído, entendido y estar de acuerdo con los siguientes Términos y Condiciones (en adelante, "Términos"). Si no estás de acuerdo con estos Términos, no debes usar el Servicio.
            </p>

            <section>
              <h3 className="font-semibold text-lg mb-3">1. Definiciones Clave</h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li><strong>"Bakan"</strong>: Se refiere a la plataforma, el sitio web y la aplicación móvil que proveen los servicios de intermediación de pagos.</li>
                <li><strong>"Usuario"</strong>: Cualquier persona natural o jurídica que se registra y utiliza los servicios de Bakan, ya sea como Comprador o Vendedor.</li>
                <li><strong>"Comprador"</strong>: El Usuario que adquiere un producto y realiza el pago a través de Bakan.</li>
                <li><strong>"Vendedor"</strong>: El Usuario que ofrece un producto y utiliza Bakan para recibir el pago.</li>
                <li><strong>"Servicio"</strong>: Se refiere al servicio de escrow o retención de pagos donde Bakan actúa como intermediario de confianza.</li>
                <li><strong>"Producto Físico"</strong>: Cualquier bien tangible que requiera envío y entrega física.</li>
                <li><strong>"Transacción"</strong>: El acuerdo completo entre un Comprador y un Vendedor para el intercambio de un producto.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-lg mb-3">2. Descripción del Servicio de Bakan</h3>
              <p className="mb-4">
                Bakan ofrece un Servicio de intermediación para asegurar las compras y ventas online.
              </p>
              
              <h4 className="font-semibold mb-2">2.1. Proceso para Productos Físicos:</h4>
              <ol className="list-decimal list-inside space-y-2 mb-4 text-muted-foreground">
                <li>Acuerdo e Inicio: Vendedor y Comprador acuerdan los términos.</li>
                <li>Pago y Retención: El Comprador realiza el pago del 100% del precio acordado a Bakan.</li>
                <li>Notificación y Envío: Bakan notifica al Vendedor que los fondos han sido asegurados.</li>
                <li>Prueba de Envío: El Vendedor debe cargar los detalles del envío.</li>
                <li>Confirmación de Recepción: El Comprador tiene 48 horas para confirmar la recepción.</li>
                <li>Liberación de Fondos: Una vez confirmado, Bakan libera el pago al Vendedor.</li>
              </ol>
            </section>

            <section>
              <h3 className="font-semibold text-lg mb-3">3. Obligaciones de los Usuarios</h3>
              <h4 className="font-semibold mb-2">3.1. Obligaciones Generales:</h4>
              <ul className="list-disc list-inside space-y-2 mb-4 text-muted-foreground">
                <li>Ser mayor de 18 años y tener capacidad legal para contratar.</li>
                <li>Proporcionar información veraz, precisa y actualizada.</li>
                <li>Mantener la confidencialidad de su contraseña y cuenta.</li>
                <li>No utilizar el Servicio para fines ilegales o fraudulentos.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-lg mb-3">4. Comisiones y Pagos</h3>
              <p className="mb-2">
                <strong>Para el Comprador:</strong> Paga el precio acordado del producto más una comisión de seguridad del 4.9% + S/ 1.00 que garantiza la protección de la transacción.
              </p>
              <p className="text-muted-foreground">
                <strong>Para el Vendedor:</strong> Recibe el precio completo del producto sin descuentos. La comisión de seguridad es asumida por el comprador.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-lg mb-3">5. Proceso de Disputas y Reclamos</h3>
              <p className="mb-3">
                Un Comprador puede iniciar una Disputa si el producto es diferente a lo descrito, llegó dañado, o no funciona. El Vendedor puede disputar si hay evidencia de entrega correcta.
              </p>
              <p className="mb-3 font-semibold">Requisito de Evidencia (CRÍTICO):</p>
              <ul className="list-disc list-inside space-y-2 mb-3 text-muted-foreground">
                <li>Para productos físicos: Video continuo de unboxing mostrando etiqueta de envío y el producto.</li>
                <li>El Vendedor debe presentar número de seguimiento y confirmación de entrega.</li>
              </ul>
              <p className="text-muted-foreground">
                La decisión del equipo de mediación de Bakan es final e inapelable.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-lg mb-3">6. Artículos Prohibidos</h3>
              <p className="mb-2">Está estrictamente prohibido usar Bakan para transacciones que involucren:</p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Artículos ilegales, estupefacientes o drogas</li>
                <li>Armas de fuego, municiones o explosivos</li>
                <li>Productos falsificados o que infrinjan derechos de autor</li>
                <li>Animales vivos</li>
                <li>Contenido pornográfico o servicios sexuales</li>
                <li>Cuentas o bienes digitales obtenidos ilícitamente</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-lg mb-3">7. Limitación de Responsabilidad</h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Bakan es una plataforma de intermediación tecnológica, no un vendedor ni comprador.</li>
                <li>No somos responsables por la calidad, seguridad o legalidad de los productos ofrecidos.</li>
                <li>No somos responsables por retrasos o daños causados por servicios de mensajería.</li>
                <li>Nuestra responsabilidad máxima se limita al monto de la comisión cobrada.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-lg mb-3">8. Privacidad</h3>
              <p className="text-muted-foreground">
                El uso de nuestro Servicio se rige por nuestra Política de Privacidad, que detalla cómo recopilamos, usamos y protegemos tus datos personales en cumplimiento con la Ley N° 29733.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-lg mb-3">9. Modificaciones a los Términos</h3>
              <p className="text-muted-foreground">
                Bakan se reserva el derecho de modificar estos Términos en cualquier momento. Notificaremos cambios significativos por correo electrónico o aviso en la plataforma.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-lg mb-3">10. Ley Aplicable y Jurisdicción</h3>
              <p className="text-muted-foreground">
                Estos Términos se regirán por las leyes de la República del Perú. Cualquier disputa se someterá a la jurisdicción de los tribunales del Cercado de Lima, Perú.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-lg mb-3">11. Contacto</h3>
              <p className="text-muted-foreground">
                Para preguntas sobre estos Términos, contáctanos en: <a href="mailto:bakanoficial@gmail.com" className="text-primary hover:underline">bakanoficial@gmail.com</a>
              </p>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
