-- Solo lectura: ejecutar y conservar resultados ANTES de la migración.
select table_name,column_name,data_type,is_nullable,column_default from information_schema.columns
where table_schema='public' and table_name in ('profiles','productos','perfumes','inventory','pedidos','pedido_items','pedido_historial') order by table_name,ordinal_position;
select schemaname,tablename,policyname,roles,cmd,qual,with_check from pg_policies where schemaname='public';
select n.nspname,p.proname,pg_get_function_identity_arguments(p.oid) as argumentos,pg_get_functiondef(p.oid) as definicion
from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in ('crear_pedido','cambiar_estado_pedido');
select conrelid::regclass as tabla,conname,pg_get_constraintdef(oid) as definicion from pg_constraint where connamespace='public'::regnamespace;

select c.relname as tabla,t.tgname,pg_get_triggerdef(t.oid) as definicion,pg_get_functiondef(t.tgfoid) as funcion from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and not t.tgisinternal;
