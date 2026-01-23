-- Function to join a transaction by invitation code securely
create or replace function public.join_transaction_by_code(_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  t record;
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  select * into t
  from public.transacciones
  where codigo_invitacion = upper(trim(_code))
  limit 1;

  if not found then
    raise exception 'INVALID_CODE';
  end if;

  if (t.vendedor_id is not null and t.comprador_id is not null) then
    raise exception 'ALREADY_COMPLETE';
  end if;

  if (t.vendedor_id = v_user or t.comprador_id = v_user) then
    raise exception 'OWN_TRANSACTION';
  end if;

  if t.vendedor_id is null then
    update public.transacciones
      set vendedor_id = v_user,
          estado = 'pendiente_pago',
          updated_at = now()
    where id = t.id;

    insert into public.mensajes(transaccion_id, emisor_id, contenido, tipo_mensaje)
    values (t.id, v_user, '🎉 El vendedor se ha unido a la transacción. El comprador debe realizar el pago.', 'sistema_automatico');
  else
    update public.transacciones
      set comprador_id = v_user,
          estado = 'pendiente_pago',
          updated_at = now()
    where id = t.id;

    insert into public.mensajes(transaccion_id, emisor_id, contenido, tipo_mensaje)
    values (t.id, v_user, '🎉 El comprador se ha unido a la transacción. Ahora debe realizar el pago.', 'sistema_automatico');
  end if;

  return t.id;
end;
$$;

-- Grant execute to authenticated users
grant execute on function public.join_transaction_by_code(text) to authenticated;
