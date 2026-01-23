import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

export const PrivacidadDialog = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="hover:text-primary transition-colors">Privacidad</button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>Política de Privacidad de Bakan</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[calc(85vh-8rem)] pr-4">
          <div className="space-y-6 text-sm">
            <p className="text-muted-foreground">Última actualización: 27 de octubre de 2025</p>
            
            <p>
              En Bakan, respetamos tu privacidad y nos comprometemos a proteger tus datos personales. Esta Política de Privacidad explica cómo recopilamos, usamos, compartimos y protegemos tu información en cumplimiento con la Ley N° 29733, Ley de Protección de Datos Personales de Perú.
            </p>

            <section>
              <h3 className="font-semibold text-lg mb-3">1. Información que Recopilamos</h3>
              <h4 className="font-semibold mb-2">1.1. Información proporcionada directamente:</h4>
              <ul className="list-disc list-inside space-y-2 mb-4 text-muted-foreground">
                <li>Datos de registro: nombre, correo electrónico, número de teléfono</li>
                <li>Información de pago: datos bancarios para transferencias</li>
                <li>Información de transacciones: detalles de productos, precios, direcciones de envío</li>
                <li>Comunicaciones: mensajes en el chat de la plataforma, consultas de soporte</li>
                <li>Documentos de verificación: DNI u otros documentos de identidad cuando sea necesario</li>
              </ul>

              <h4 className="font-semibold mb-2">1.2. Información recopilada automáticamente:</h4>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Datos de uso: páginas visitadas, clics, tiempo en la plataforma</li>
                <li>Información del dispositivo: dirección IP, tipo de navegador, sistema operativo</li>
                <li>Cookies y tecnologías similares para mejorar tu experiencia</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-lg mb-3">2. Cómo Usamos tu Información</h3>
              <p className="mb-2">Utilizamos tus datos personales para:</p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Facilitar transacciones seguras entre compradores y vendedores</li>
                <li>Procesar pagos y transferencias de fondos</li>
                <li>Verificar identidades y prevenir fraudes</li>
                <li>Resolver disputas y proporcionar atención al cliente</li>
                <li>Enviar notificaciones sobre transacciones, cambios en términos o actualizaciones del servicio</li>
                <li>Mejorar nuestra plataforma y desarrollar nuevas funcionalidades</li>
                <li>Cumplir con obligaciones legales y regulatorias</li>
                <li>Realizar análisis estadísticos y de comportamiento (datos anonimizados)</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-lg mb-3">3. Compartir tu Información</h3>
              <p className="mb-2">No vendemos ni alquilamos tus datos personales. Podemos compartir tu información con:</p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li><strong>Contrapartes de transacciones:</strong> Compartimos información mínima necesaria entre compradores y vendedores para completar transacciones.</li>
                <li><strong>Proveedores de servicios:</strong> Terceros que nos ayudan a operar (procesadores de pago, servicios de hosting, análisis).</li>
                <li><strong>Autoridades legales:</strong> Cuando sea requerido por ley, orden judicial o para proteger derechos legales.</li>
                <li><strong>Fusiones o adquisiciones:</strong> En caso de venta o transferencia de nuestro negocio.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-lg mb-3">4. Seguridad de tus Datos</h3>
              <p className="mb-2">Implementamos medidas técnicas y organizativas para proteger tus datos:</p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Encriptación SSL/TLS para todas las transmisiones de datos</li>
                <li>Almacenamiento seguro en servidores con acceso restringido</li>
                <li>Monitoreo continuo de actividades sospechosas</li>
                <li>Verificación en dos pasos para cuentas de usuario</li>
                <li>Políticas internas de acceso limitado a datos personales</li>
                <li>Auditorías de seguridad periódicas</li>
              </ul>
              <p className="mt-3 text-muted-foreground">
                Sin embargo, ningún sistema es 100% seguro. Te recomendamos mantener tu contraseña confidencial y reportar cualquier actividad sospechosa.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-lg mb-3">5. Retención de Datos</h3>
              <p className="text-muted-foreground">
                Conservamos tus datos personales mientras tu cuenta esté activa y por un período adicional de 5 años después del cierre de cuenta o última transacción, según lo requiere la normativa peruana de prevención de lavado de activos y registros contables. Datos anonimizados pueden conservarse indefinidamente con fines estadísticos.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-lg mb-3">6. Tus Derechos</h3>
              <p className="mb-2">Conforme a la Ley N° 29733, tienes derecho a:</p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li><strong>Acceso:</strong> Solicitar una copia de tus datos personales que tenemos</li>
                <li><strong>Rectificación:</strong> Corregir datos inexactos o desactualizados</li>
                <li><strong>Cancelación:</strong> Solicitar la eliminación de tus datos (sujeto a obligaciones legales)</li>
                <li><strong>Oposición:</strong> Oponerte al tratamiento de tus datos en ciertos casos</li>
                <li><strong>Revocación del consentimiento:</strong> Retirar tu consentimiento en cualquier momento</li>
                <li><strong>Portabilidad:</strong> Recibir tus datos en formato estructurado y legible por máquina</li>
              </ul>
              <p className="mt-3 text-muted-foreground">
                Para ejercer estos derechos, contáctanos en: <a href="mailto:bakanoficial@gmail.com" className="text-primary hover:underline">bakanoficial@gmail.com</a>
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-lg mb-3">7. Cookies y Tecnologías de Rastreo</h3>
              <p className="mb-2">Usamos cookies para:</p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Mantener tu sesión activa</li>
                <li>Recordar tus preferencias</li>
                <li>Analizar el tráfico y comportamiento en la plataforma</li>
                <li>Mejorar la seguridad</li>
              </ul>
              <p className="mt-3 text-muted-foreground">
                Puedes configurar tu navegador para rechazar cookies, aunque esto puede afectar la funcionalidad del sitio.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-lg mb-3">8. Transferencias Internacionales</h3>
              <p className="text-muted-foreground">
                Tus datos se almacenan principalmente en servidores ubicados en [ubicación del servidor]. Si transferimos datos fuera de Perú, nos aseguramos de que existan medidas de protección adecuadas conforme a la legislación aplicable.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-lg mb-3">9. Menores de Edad</h3>
              <p className="text-muted-foreground">
                Nuestro servicio está dirigido a mayores de 18 años. No recopilamos intencionalmente datos de menores. Si descubrimos que hemos recopilado información de un menor, la eliminaremos de inmediato.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-lg mb-3">10. Cambios a esta Política</h3>
              <p className="text-muted-foreground">
                Podemos actualizar esta Política de Privacidad periódicamente. Te notificaremos cambios significativos por correo electrónico o mediante un aviso en la plataforma. La fecha de "Última actualización" al inicio indica la versión vigente.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-lg mb-3">11. Autoridad de Control</h3>
              <p className="text-muted-foreground">
                Si consideras que tus derechos de protección de datos han sido vulnerados, puedes presentar una reclamación ante la Autoridad Nacional de Protección de Datos Personales de Perú.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-lg mb-3">12. Contacto</h3>
              <p className="text-muted-foreground">
                Para consultas sobre esta Política de Privacidad o para ejercer tus derechos, contáctanos en:
                <br />
                Email: <a href="mailto:bakanoficial@gmail.com" className="text-primary hover:underline">bakanoficial@gmail.com</a>
              </p>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
