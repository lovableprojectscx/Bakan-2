import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Image as ImageIcon } from "lucide-react";

interface MetodoPago {
  id: string;
  banco: string;
  titular: string;
  numero_cuenta_o_celular: string;
  instrucciones_adicionales: string | null;
  qr_image_url: string | null;
  esta_activa: boolean;
}

export function GestionarMetodosPagoTab() {
  const [metodos, setMetodos] = useState<MetodoPago[]>([]);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [nuevoMetodo, setNuevoMetodo] = useState({
    banco: "",
    titular: "",
    numero_cuenta_o_celular: "",
    instrucciones_adicionales: "",
    esta_activa: true,
  });
  const [archivoQR, setArchivoQR] = useState<File | null>(null);

  useEffect(() => {
    fetchMetodos();
  }, []);

  const fetchMetodos = async () => {
    try {
      const { data, error } = await supabase
        .from("cuentas_bancarias_bakan")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMetodos(data || []);
    } catch (error) {
      console.error("Error fetching payment methods:", error);
      toast.error("Error al cargar métodos de pago");
    } finally {
      setLoading(false);
    }
  };

  const subirQR = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("qr-pagos")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("qr-pagos")
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error("Error uploading QR:", error);
      toast.error("Error al subir imagen QR");
      return null;
    }
  };

  const agregarMetodo = async () => {
    if (!nuevoMetodo.banco || !nuevoMetodo.titular) {
      toast.error("Por favor completa los campos obligatorios (Banco y Titular)");
      return;
    }

    setGuardando(true);
    try {
      let qrUrl = null;
      if (archivoQR) {
        qrUrl = await subirQR(archivoQR);
      }

      const { error } = await supabase
        .from("cuentas_bancarias_bakan")
        .insert({
          ...nuevoMetodo,
          qr_image_url: qrUrl,
        });

      if (error) throw error;

      toast.success("Método de pago agregado correctamente");
      setNuevoMetodo({
        banco: "",
        titular: "",
        numero_cuenta_o_celular: "",
        instrucciones_adicionales: "",
        esta_activa: true,
      });
      setArchivoQR(null);
      fetchMetodos();
    } catch (error) {
      console.error("Error adding payment method:", error);
      toast.error("Error al agregar método de pago");
    } finally {
      setGuardando(false);
    }
  };

  const toggleActivo = async (id: string, estaActiva: boolean) => {
    try {
      const { error } = await supabase
        .from("cuentas_bancarias_bakan")
        .update({ esta_activa: !estaActiva })
        .eq("id", id);

      if (error) throw error;

      toast.success(`Método ${!estaActiva ? "activado" : "desactivado"}`);
      fetchMetodos();
    } catch (error) {
      console.error("Error toggling payment method:", error);
      toast.error("Error al actualizar método de pago");
    }
  };

  const eliminarMetodo = async (id: string, qrUrl: string | null) => {
    if (!confirm("¿Estás seguro de eliminar este método de pago?")) return;

    try {
      // Delete QR image if exists
      if (qrUrl) {
        const path = qrUrl.split("/qr-pagos/")[1];
        if (path) {
          await supabase.storage.from("qr-pagos").remove([path]);
        }
      }

      const { error } = await supabase
        .from("cuentas_bancarias_bakan")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Método de pago eliminado");
      fetchMetodos();
    } catch (error) {
      console.error("Error deleting payment method:", error);
      toast.error("Error al eliminar método de pago");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Form to add new payment method */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Agregar Método de Pago
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="banco">Banco / Método *</Label>
              <Input
                id="banco"
                placeholder="Ej: Yape, BCP, Interbank"
                value={nuevoMetodo.banco}
                onChange={(e) => setNuevoMetodo({ ...nuevoMetodo, banco: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="titular">Titular *</Label>
              <Input
                id="titular"
                placeholder="Nombre del titular"
                value={nuevoMetodo.titular}
                onChange={(e) => setNuevoMetodo({ ...nuevoMetodo, titular: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="numero">Número de Cuenta / Celular</Label>
              <Input
                id="numero"
                placeholder="Número (Opcional)"
                value={nuevoMetodo.numero_cuenta_o_celular}
                onChange={(e) =>
                  setNuevoMetodo({ ...nuevoMetodo, numero_cuenta_o_celular: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="qr">QR de Pago (Opcional)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="qr"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setArchivoQR(e.target.files?.[0] || null)}
                />
                {archivoQR && <ImageIcon className="h-5 w-5 text-green-600" />}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="instrucciones">Instrucciones Adicionales</Label>
            <Textarea
              id="instrucciones"
              placeholder="Información adicional para el pago..."
              value={nuevoMetodo.instrucciones_adicionales}
              onChange={(e) =>
                setNuevoMetodo({ ...nuevoMetodo, instrucciones_adicionales: e.target.value })
              }
            />
          </div>

          <div className="flex items-center gap-2">
            <Switch
              checked={nuevoMetodo.esta_activa}
              onCheckedChange={(checked) => setNuevoMetodo({ ...nuevoMetodo, esta_activa: checked })}
            />
            <Label>Activar método de pago</Label>
          </div>

          <Button onClick={agregarMetodo} disabled={guardando} className="w-full">
            {guardando ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Agregar Método de Pago
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* List of existing payment methods */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Métodos de Pago Configurados</h3>
        {metodos.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No hay métodos de pago configurados
            </CardContent>
          </Card>
        ) : (
          metodos.map((metodo) => (
            <Card key={metodo.id}>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  {metodo.qr_image_url && (
                    <div className="flex-shrink-0">
                      <img
                        src={metodo.qr_image_url}
                        alt="QR de pago"
                        className="w-32 h-32 object-cover rounded border"
                      />
                    </div>
                  )}

                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-lg">{metodo.banco}</h4>
                        <p className="text-sm text-muted-foreground">Titular: {metodo.titular}</p>
                        <p className="text-sm text-muted-foreground">
                          Cuenta/Celular: {metodo.numero_cuenta_o_celular}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={metodo.esta_activa}
                          onCheckedChange={() => toggleActivo(metodo.id, metodo.esta_activa)}
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => eliminarMetodo(metodo.id, metodo.qr_image_url)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {metodo.instrucciones_adicionales && (
                      <div className="mt-2 p-3 bg-muted rounded-md">
                        <p className="text-sm">{metodo.instrucciones_adicionales}</p>
                      </div>
                    )}

                    <div className="flex items-center gap-2 mt-2">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${metodo.esta_activa
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                          }`}
                      >
                        {metodo.esta_activa ? "Activo" : "Inactivo"}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
