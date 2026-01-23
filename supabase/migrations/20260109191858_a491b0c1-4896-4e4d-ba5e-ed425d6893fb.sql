-- Ensure bucket exists (private)
insert into storage.buckets (id, name, public)
values ('pruebas-envio', 'pruebas-envio', false)
on conflict (id) do nothing;

-- Recreate RLS policies for pruebas-envio objects
-- NOTE: We enforce folder layout: {userId}/{transaccionId}/{file}

drop policy if exists "Users can upload shipping proofs for their transactions" on storage.objects;
drop policy if exists "Users can view shipping proofs from their transactions" on storage.objects;
drop policy if exists "Users can delete shipping proofs" on storage.objects;

create policy "Users can upload shipping proofs for their transactions"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'pruebas-envio'
  and auth.uid() is not null
  and auth.uid()::text = (storage.foldername(name))[1]
  and exists (
    select 1
    from public.transacciones t
    where t.id::text = (storage.foldername(name))[2]
      and (t.vendedor_id = auth.uid() or t.comprador_id = auth.uid())
  )
);

create policy "Users can view shipping proofs from their transactions"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'pruebas-envio'
  and (
    public.has_role(auth.uid(), 'admin'::app_role)
    or exists (
      select 1
      from public.transacciones t
      where t.id::text = (storage.foldername(name))[2]
        and (t.vendedor_id = auth.uid() or t.comprador_id = auth.uid())
    )
  )
);

create policy "Users can delete shipping proofs"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'pruebas-envio'
  and auth.uid() is not null
  and auth.uid()::text = (storage.foldername(name))[1]
  and exists (
    select 1
    from public.transacciones t
    where t.id::text = (storage.foldername(name))[2]
      and (t.vendedor_id = auth.uid() or t.comprador_id = auth.uid())
  )
);
