export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      calificaciones: {
        Row: {
          calificado_id: string
          calificador_id: string
          comentario: string | null
          fecha: string | null
          id: string
          puntuacion: number
          transaccion_id: string
        }
        Insert: {
          calificado_id: string
          calificador_id: string
          comentario?: string | null
          fecha?: string | null
          id?: string
          puntuacion: number
          transaccion_id: string
        }
        Update: {
          calificado_id?: string
          calificador_id?: string
          comentario?: string | null
          fecha?: string | null
          id?: string
          puntuacion?: number
          transaccion_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "calificaciones_calificado_id_fkey"
            columns: ["calificado_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calificaciones_calificador_id_fkey"
            columns: ["calificador_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calificaciones_transaccion_id_fkey"
            columns: ["transaccion_id"]
            isOneToOne: false
            referencedRelation: "transacciones"
            referencedColumns: ["id"]
          },
        ]
      }
      cuentas_bancarias_bakan: {
        Row: {
          banco: string
          created_at: string | null
          esta_activa: boolean | null
          id: string
          instrucciones_adicionales: string | null
          numero_cuenta_o_celular: string
          qr_image_url: string | null
          titular: string
          updated_at: string | null
        }
        Insert: {
          banco: string
          created_at?: string | null
          esta_activa?: boolean | null
          id?: string
          instrucciones_adicionales?: string | null
          numero_cuenta_o_celular: string
          qr_image_url?: string | null
          titular: string
          updated_at?: string | null
        }
        Update: {
          banco?: string
          created_at?: string | null
          esta_activa?: boolean | null
          id?: string
          instrucciones_adicionales?: string | null
          numero_cuenta_o_celular?: string
          qr_image_url?: string | null
          titular?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      disputas: {
        Row: {
          created_at: string | null
          estado_disputa: Database["public"]["Enums"]["estado_disputa"] | null
          fecha_apertura: string | null
          fecha_cierre: string | null
          id: string
          motivo: string
          reembolso_banco_comprador: string | null
          reembolso_cuenta_comprador: string | null
          reembolso_estado: Database["public"]["Enums"]["reembolso_estado"] | null
          reembolso_voucher_url: string | null
          reportante_id: string
          resolucion_final: string | null
          transaccion_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          estado_disputa?: Database["public"]["Enums"]["estado_disputa"] | null
          fecha_apertura?: string | null
          fecha_cierre?: string | null
          id?: string
          motivo: string
          reembolso_banco_comprador?: string | null
          reembolso_cuenta_comprador?: string | null
          reembolso_estado?: Database["public"]["Enums"]["reembolso_estado"] | null
          reembolso_voucher_url?: string | null
          reportante_id: string
          resolucion_final?: string | null
          transaccion_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          estado_disputa?: Database["public"]["Enums"]["estado_disputa"] | null
          fecha_apertura?: string | null
          fecha_cierre?: string | null
          id?: string
          motivo?: string
          reembolso_banco_comprador?: string | null
          reembolso_cuenta_comprador?: string | null
          reembolso_estado?: Database["public"]["Enums"]["reembolso_estado"] | null
          reembolso_voucher_url?: string | null
          reportante_id?: string
          resolucion_final?: string | null
          transaccion_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "disputas_reportante_id_fkey"
            columns: ["reportante_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputas_transaccion_id_fkey"
            columns: ["transaccion_id"]
            isOneToOne: false
            referencedRelation: "transacciones"
            referencedColumns: ["id"]
          },
        ]
      }
      mensajes: {
        Row: {
          contenido: string
          emisor_id: string
          id: string
          timestamp: string | null
          tipo_mensaje: Database["public"]["Enums"]["tipo_mensaje"] | null
          transaccion_id: string
          url_archivo: string | null
        }
        Insert: {
          contenido: string
          emisor_id: string
          id?: string
          timestamp?: string | null
          tipo_mensaje?: Database["public"]["Enums"]["tipo_mensaje"] | null
          transaccion_id: string
          url_archivo?: string | null
        }
        Update: {
          contenido?: string
          emisor_id?: string
          id?: string
          timestamp?: string | null
          tipo_mensaje?: Database["public"]["Enums"]["tipo_mensaje"] | null
          transaccion_id?: string
          url_archivo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mensajes_emisor_id_fkey"
            columns: ["emisor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensajes_transaccion_id_fkey"
            columns: ["transaccion_id"]
            isOneToOne: false
            referencedRelation: "transacciones"
            referencedColumns: ["id"]
          },
        ]
      }
      password_resets: {
        Row: {
          created_at: string | null
          email: string
          fecha_expiracion: string
          id: string
          token: string
        }
        Insert: {
          created_at?: string | null
          email: string
          fecha_expiracion: string
          id?: string
          token: string
        }
        Update: {
          created_at?: string | null
          email?: string
          fecha_expiracion?: string
          id?: string
          token?: string
        }
        Relationships: []
      }
      perfiles_financieros: {
        Row: {
          banco: string
          created_at: string | null
          esta_activo: boolean | null
          id: string
          numero_cuenta: string
          tipo_cuenta: Database["public"]["Enums"]["tipo_cuenta_bancaria"]
          updated_at: string | null
          usuario_id: string
        }
        Insert: {
          banco: string
          created_at?: string | null
          esta_activo?: boolean | null
          id?: string
          numero_cuenta: string
          tipo_cuenta: Database["public"]["Enums"]["tipo_cuenta_bancaria"]
          updated_at?: string | null
          usuario_id: string
        }
        Update: {
          banco?: string
          created_at?: string | null
          esta_activo?: boolean | null
          id?: string
          numero_cuenta?: string
          tipo_cuenta?: Database["public"]["Enums"]["tipo_cuenta_bancaria"]
          updated_at?: string | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "perfiles_financieros_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          documento_identidad_url: string | null
          estado_cuenta: Database["public"]["Enums"]["estado_cuenta"] | null
          estado_verificacion: Database["public"]["Enums"]["estado_verificacion"] | null
          fecha_registro: string | null
          id: string
          nombre_completo: string
          telefono: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          documento_identidad_url?: string | null
          estado_cuenta?: Database["public"]["Enums"]["estado_cuenta"] | null
          estado_verificacion?: Database["public"]["Enums"]["estado_verificacion"] | null
          fecha_registro?: string | null
          id: string
          nombre_completo: string
          telefono?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          documento_identidad_url?: string | null
          estado_cuenta?: Database["public"]["Enums"]["estado_cuenta"] | null
          estado_verificacion?: Database["public"]["Enums"]["estado_verificacion"] | null
          fecha_registro?: string | null
          id?: string
          nombre_completo?: string
          telefono?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      pruebas_transaccion: {
        Row: {
          descripcion: string | null
          fecha_carga: string | null
          id: string
          tipo_prueba: Database["public"]["Enums"]["tipo_prueba"]
          transaccion_id: string
          url_archivo: string
          usuario_id: string
        }
        Insert: {
          descripcion?: string | null
          fecha_carga?: string | null
          id?: string
          tipo_prueba: Database["public"]["Enums"]["tipo_prueba"]
          transaccion_id: string
          url_archivo: string
          usuario_id: string
        }
        Update: {
          descripcion?: string | null
          fecha_carga?: string | null
          id?: string
          tipo_prueba?: Database["public"]["Enums"]["tipo_prueba"]
          transaccion_id?: string
          url_archivo?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pruebas_transaccion_transaccion_id_fkey"
            columns: ["transaccion_id"]
            isOneToOne: false
            referencedRelation: "transacciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pruebas_transaccion_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      registros_admin: {
        Row: {
          accion_realizada: string
          admin_id: string
          id: string
          timestamp: string | null
          transaccion_id: string | null
          usuario_afectado_id: string | null
        }
        Insert: {
          accion_realizada: string
          admin_id: string
          id?: string
          timestamp?: string | null
          transaccion_id?: string | null
          usuario_afectado_id?: string | null
        }
        Update: {
          accion_realizada?: string
          admin_id?: string
          id?: string
          timestamp?: string | null
          transaccion_id?: string | null
          usuario_afectado_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "registros_admin_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registros_admin_transaccion_id_fkey"
            columns: ["transaccion_id"]
            isOneToOne: false
            referencedRelation: "transacciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registros_admin_usuario_afectado_id_fkey"
            columns: ["usuario_afectado_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      transacciones: {
        Row: {
          admin_id_mediador: string | null
          admin_id_verificador: string | null
          codigo_invitacion: string
          comision_bakan: number
          comprador_id: string | null
          created_at: string | null
          descripcion: string | null
          estado: Database["public"]["Enums"]["estado_transaccion"] | null
          estado_pago_vendedor: Database["public"]["Enums"]["estado_pago_vendedor"] | null
          fecha_creacion: string | null
          fecha_envio: string | null
          fecha_liberacion: string | null
          fecha_pago: string | null
          id: string
          monto_a_liberar: number
          precio_producto: number
          tipo_producto: Database["public"]["Enums"]["tipo_producto"]
          titulo_producto: string
          updated_at: string | null
          vendedor_id: string | null
          voucher_pago_vendedor_url: string | null
        }
        Insert: {
          admin_id_mediador?: string | null
          admin_id_verificador?: string | null
          codigo_invitacion: string
          comision_bakan: number
          comprador_id?: string | null
          created_at?: string | null
          descripcion?: string | null
          estado?: Database["public"]["Enums"]["estado_transaccion"] | null
          estado_pago_vendedor?: Database["public"]["Enums"]["estado_pago_vendedor"] | null
          fecha_creacion?: string | null
          fecha_envio?: string | null
          fecha_liberacion?: string | null
          fecha_pago?: string | null
          id?: string
          monto_a_liberar: number
          precio_producto: number
          tipo_producto: Database["public"]["Enums"]["tipo_producto"]
          titulo_producto: string
          updated_at?: string | null
          vendedor_id?: string | null
          voucher_pago_vendedor_url?: string | null
        }
        Update: {
          admin_id_mediador?: string | null
          admin_id_verificador?: string | null
          codigo_invitacion?: string
          comision_bakan?: number
          comprador_id?: string | null
          created_at?: string | null
          descripcion?: string | null
          estado?: Database["public"]["Enums"]["estado_transaccion"] | null
          estado_pago_vendedor?: Database["public"]["Enums"]["estado_pago_vendedor"] | null
          fecha_creacion?: string | null
          fecha_envio?: string | null
          fecha_liberacion?: string | null
          fecha_pago?: string | null
          id?: string
          monto_a_liberar?: number
          precio_producto?: number
          tipo_producto?: Database["public"]["Enums"]["tipo_producto"]
          titulo_producto?: string
          updated_at?: string | null
          vendedor_id?: string | null
          voucher_pago_vendedor_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transacciones_admin_id_mediador_fkey"
            columns: ["admin_id_mediador"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transacciones_admin_id_verificador_fkey"
            columns: ["admin_id_verificador"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transacciones_comprador_id_fkey"
            columns: ["comprador_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transacciones_vendedor_id_fkey"
            columns: ["vendedor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      join_transaction_by_code: {
        Args: {
          _code: string
        }
        Returns: string
      }
      search_user_by_email: {
        Args: {
          _email: string
        }
        Returns: {
          user_id: string
          email: string
        }[]
      }
    }
    Enums: {
      app_role: "usuario" | "admin"
      estado_cuenta: "activo" | "suspendido"
      estado_disputa: "abierta" | "en_investigacion" | "resuelta"
      estado_pago_vendedor: "pendiente_de_pago" | "en_proceso" | "pagado"
      estado_transaccion:
        | "iniciada"
        | "pendiente_pago"
        | "pago_en_verificacion"
        | "pagada_retenida"
        | "enviado"
        | "completada"
        | "en_disputa"
        | "cancelada"
        | "cancelada_automatico"
      estado_verificacion:
        | "no_verificado"
        | "pendiente_revision"
        | "verificado"
      reembolso_estado: "pendiente_devolucion" | "completado"
      tipo_cuenta_bancaria: "ahorros" | "corriente" | "celular"
      tipo_mensaje: "usuario_normal" | "sistema_automatico" | "sistema_admin"
      tipo_producto: "fisico" | "digital"
      tipo_prueba:
        | "voucher_pago"
        | "prueba_envio"
        | "video_empaquetado"
        | "video_unboxing"
        | "screencast_digital"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
        Database["public"]["Views"])
    ? (Database["public"]["Tables"] &
        Database["public"]["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
    ? Database["public"]["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof Database["public"]["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof Database["public"]["CompositeTypes"]
    ? Database["public"]["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
