-- ============================================================================
-- AgendaPro — AUDITORIA TOTAL SOMENTE LEITURA V3
-- Base: ZIP antigo funcional AgendaPro-main + sprints recentes
--
-- SEGURO PARA DATABASE COMPARTILHADA:
-- - Somente SELECT
-- - Não cria tabela
-- - Não altera tabela
-- - Não apaga dados
-- - Não mexe em RLS/policies
--
-- Objetivo:
-- Verificar tudo que pode quebrar conexão/salvamento/publicação/login:
-- tabelas, colunas legadas, colunas novas, RPCs/funções, RLS e possíveis
-- conflitos com outros projetos.
-- ============================================================================

select
  current_database() as database_atual,
  current_schema() as schema_atual,
  current_user as usuario_sql,
  now() as verificado_em;

-- ============================================================================
-- 1. TABELAS USADAS POR CÓDIGO/API/DOCS
-- ============================================================================

with expected_tables(table_name, criticidade, motivo) as (
  values
    ('agendapro_client_accounts','CRITICO','login, sessão, perfil e conta'),
    ('agendapro_companies','CRITICO','empresa principal/vínculo da conta'),
    ('agendapro_account_companies','CRITICO','vínculo legado conta-empresa usado no ZIP funcional'),
    ('agendapro_created_agendas','CRITICO','criar, salvar, publicar e abrir agenda'),
    ('agendapro_public_booking_requests','CRITICO','agendamentos públicos e gestão de status'),
    ('agendapro_manual_payment_requests','CRITICO','pagamento manual'),
    ('agendapro_client_activity_logs','CRITICO','logs do painel do cliente'),
    ('agendapro_dev_audit_logs','CRITICO','logs da Central Dev'),
    ('agendapro_license_keys','CRITICO','keys/licenças'),
    ('agendapro_license_key_redemptions','CRITICO','uso de keys/licenças'),
    ('agendapro_quick_briefings','CRITICO','briefings e implantação'),
    ('agendapro_payment_webhook_events','CRITICO','webhooks Mercado Pago'),
    ('agendapro_checkout_sessions','CRITICO','checkout Mercado Pago'),
    ('agendapro_payments','CRITICO','pagamentos consolidados'),
    ('agendapro_subscriptions','CRITICO','assinaturas liberadas por pagamento'),
    ('agendapro_onboarding_sessions','CRITICO','onboarding após pagamento'),
    ('agendapro_support_cases','CRITICO','suporte/Central Dev'),
    ('agendapro_support_notes','CRITICO','notas internas de suporte'),
    ('agendapro_admin_settings','CRITICO','configurações internas da Central Dev'),
    ('agendapro_system_alerts','CRITICO','alertas operacionais'),
    ('agendapro_internal_tasks','CRITICO','tarefas internas'),
    ('agendapro_access_events','IMPORTANTE','eventos de acesso/plano da sprint 0.6.1.0'),
    ('agendapro_message_templates','OPCIONAL','templates de comunicação futuros'),
    ('agendapro_notification_settings','OPCIONAL','preferências de notificação futuras'),
    ('agendapro_services','OPCIONAL','serviços normalizados futuros'),
    ('agendapro_team_members','OPCIONAL','equipe normalizada futura'),
    ('agendapro_clients','OPCIONAL','clientes finais normalizados futuros'),
    ('agendapro_appointments','OPCIONAL','appointments normalizados futuros'),
    ('agendapro_units','OPCIONAL','multiunidades futuro'),
    ('agendapro_analytics_events','OPCIONAL','analytics futuro'),
    ('agendapro_waitlist_entries','OPCIONAL','lista de espera/landing')
)
select
  e.criticidade,
  e.table_name,
  case when t.table_name is not null then 'OK' else 'FALTANDO' end as status,
  e.motivo
from expected_tables e
left join information_schema.tables t
  on t.table_schema = 'public'
 and t.table_name = e.table_name
order by
  case
    when t.table_name is null and e.criticidade = 'CRITICO' then 0
    when t.table_name is null then 1
    else 2
  end,
  e.criticidade,
  e.table_name;

-- ============================================================================
-- 2. COLUNAS CRÍTICAS E LEGADAS
-- ============================================================================

with expected_columns(table_name, column_name, criticidade, motivo) as (
  values
    -- contas
    ('agendapro_client_accounts','id','CRITICO','id'),
    ('agendapro_client_accounts','auth_user_id','CRITICO','RPC/workspace antigo e vínculo com auth.uid'),
    ('agendapro_client_accounts','full_name','CRITICO','nome no painel'),
    ('agendapro_client_accounts','email','CRITICO','login e busca'),
    ('agendapro_client_accounts','whatsapp','CRITICO','perfil'),
    ('agendapro_client_accounts','phone','IMPORTANTE','campo legado de telefone'),
    ('agendapro_client_accounts','status','CRITICO','status de acesso'),
    ('agendapro_client_accounts','plan','CRITICO','plano legado usado em Central Dev'),
    ('agendapro_client_accounts','plan_id','IMPORTANTE','plano novo'),
    ('agendapro_client_accounts','plan_status','IMPORTANTE','status do plano novo'),
    ('agendapro_client_accounts','payment_status','CRITICO','pagamento'),
    ('agendapro_client_accounts','subscription_status','CRITICO','assinatura'),
    ('agendapro_client_accounts','expires_at','IMPORTANTE','validade/acesso'),
    ('agendapro_client_accounts','company_id','CRITICO','vínculo direto com empresa'),
    ('agendapro_client_accounts','business_name','IMPORTANTE','nome do negócio novo'),
    ('agendapro_client_accounts','company_name','IMPORTANTE','nome da empresa novo'),
    ('agendapro_client_accounts','internal_note','IMPORTANTE','Central Dev'),
    ('agendapro_client_accounts','metadata','CRITICO','fallback/metadados'),
    ('agendapro_client_accounts','created_at','CRITICO','datas'),
    ('agendapro_client_accounts','updated_at','CRITICO','persistência'),

    -- empresas
    ('agendapro_companies','id','CRITICO','id'),
    ('agendapro_companies','owner_account_id','CRITICO','getPrimaryCompany antigo'),
    ('agendapro_companies','client_account_id','IMPORTANTE','vínculo novo'),
    ('agendapro_companies','slug','CRITICO','slug interno'),
    ('agendapro_companies','name','CRITICO','nome'),
    ('agendapro_companies','business_name','IMPORTANTE','nome público'),
    ('agendapro_companies','company_name','IMPORTANTE','nome novo'),
    ('agendapro_companies','public_slug','CRITICO','slug/link público'),
    ('agendapro_companies','category','IMPORTANTE','categoria'),
    ('agendapro_companies','status','CRITICO','status'),
    ('agendapro_companies','phone','IMPORTANTE','telefone legado'),
    ('agendapro_companies','whatsapp','CRITICO','whatsapp'),
    ('agendapro_companies','email','CRITICO','email'),
    ('agendapro_companies','owner_email','IMPORTANTE','busca nova por e-mail'),
    ('agendapro_companies','address','CRITICO','endereço'),
    ('agendapro_companies','description','CRITICO','descrição antiga'),
    ('agendapro_companies','plan','CRITICO','plano legado'),
    ('agendapro_companies','current_plan_id','CRITICO','plano atual antigo'),
    ('agendapro_companies','plan_id','IMPORTANTE','plano novo'),
    ('agendapro_companies','plan_status','IMPORTANTE','status plano novo'),
    ('agendapro_companies','payment_status','IMPORTANTE','status pagamento novo'),
    ('agendapro_companies','subscription_status','CRITICO','assinatura'),
    ('agendapro_companies','plan_started_at','CRITICO','início plano'),
    ('agendapro_companies','plan_expires_at','CRITICO','fim plano'),
    ('agendapro_companies','onboarding_status','CRITICO','onboarding'),
    ('agendapro_companies','readiness_score','CRITICO','score antigo'),
    ('agendapro_companies','agenda_readiness_status','IMPORTANTE','score novo'),
    ('agendapro_companies','agenda_readiness_score','IMPORTANTE','score novo'),
    ('agendapro_companies','agenda_validation_issues','IMPORTANTE','pendências novas'),
    ('agendapro_companies','theme_color','IMPORTANTE','tema antigo'),
    ('agendapro_companies','metadata','CRITICO','metadata'),
    ('agendapro_companies','created_at','CRITICO','datas'),
    ('agendapro_companies','updated_at','CRITICO','persistência'),

    -- vínculo conta-empresa
    ('agendapro_account_companies','id','CRITICO','id'),
    ('agendapro_account_companies','account_id','CRITICO','conta'),
    ('agendapro_account_companies','company_id','CRITICO','empresa'),
    ('agendapro_account_companies','role','IMPORTANTE','permissão'),
    ('agendapro_account_companies','is_active','CRITICO','filtro ativo'),
    ('agendapro_account_companies','created_at','IMPORTANTE','datas'),
    ('agendapro_account_companies','updated_at','IMPORTANTE','datas'),

    -- agendas
    ('agendapro_created_agendas','id','CRITICO','id'),
    ('agendapro_created_agendas','account_id','CRITICO','dono antigo'),
    ('agendapro_created_agendas','client_account_id','IMPORTANTE','dono novo'),
    ('agendapro_created_agendas','company_id','CRITICO','empresa'),
    ('agendapro_created_agendas','email','CRITICO','e-mail dono'),
    ('agendapro_created_agendas','full_name','CRITICO','nome dono antigo'),
    ('agendapro_created_agendas','whatsapp','CRITICO','contato'),
    ('agendapro_created_agendas','phone','IMPORTANTE','telefone legado'),
    ('agendapro_created_agendas','business_name','CRITICO','negócio'),
    ('agendapro_created_agendas','company_name','IMPORTANTE','empresa novo'),
    ('agendapro_created_agendas','name','IMPORTANTE','nome novo'),
    ('agendapro_created_agendas','slug','IMPORTANTE','slug novo'),
    ('agendapro_created_agendas','public_slug','CRITICO','slug público'),
    ('agendapro_created_agendas','public_link','CRITICO','link antigo'),
    ('agendapro_created_agendas','plan_id','CRITICO','plano'),
    ('agendapro_created_agendas','status','CRITICO','draft/published'),
    ('agendapro_created_agendas','publication_status','IMPORTANTE','publicação nova'),
    ('agendapro_created_agendas','published_at','CRITICO','publicado em'),
    ('agendapro_created_agendas','unpublished_at','IMPORTANTE','despublicado em'),
    ('agendapro_created_agendas','published','CRITICO','boolean antigo'),
    ('agendapro_created_agendas','is_published','IMPORTANTE','boolean novo'),
    ('agendapro_created_agendas','accepting_bookings','IMPORTANTE','aceita agendamentos'),
    ('agendapro_created_agendas','segment','CRITICO','segmento antigo'),
    ('agendapro_created_agendas','address','CRITICO','endereço'),
    ('agendapro_created_agendas','description','CRITICO','descrição antiga'),
    ('agendapro_created_agendas','public_description','IMPORTANTE','descrição nova'),
    ('agendapro_created_agendas','cancellation_policy','IMPORTANTE','política nova'),
    ('agendapro_created_agendas','theme','CRITICO','tema antigo'),
    ('agendapro_created_agendas','theme_config','IMPORTANTE','tema novo'),
    ('agendapro_created_agendas','theme_color','IMPORTANTE','cor tema'),
    ('agendapro_created_agendas','services','CRITICO','serviços'),
    ('agendapro_created_agendas','team','CRITICO','equipe antiga'),
    ('agendapro_created_agendas','professionals','IMPORTANTE','profissionais novo'),
    ('agendapro_created_agendas','hours','CRITICO','horários antigos'),
    ('agendapro_created_agendas','rules','CRITICO','regras antigas'),
    ('agendapro_created_agendas','schedule_config','CRITICO','config agenda'),
    ('agendapro_created_agendas','availability','IMPORTANTE','disponibilidade nova'),
    ('agendapro_created_agendas','readiness_score','IMPORTANTE','score'),
    ('agendapro_created_agendas','readiness_status','IMPORTANTE','status score'),
    ('agendapro_created_agendas','validation_issues','IMPORTANTE','pendências'),
    ('agendapro_created_agendas','metadata','IMPORTANTE','metadata'),
    ('agendapro_created_agendas','raw_payload','CRITICO','payload'),
    ('agendapro_created_agendas','created_at','CRITICO','datas'),
    ('agendapro_created_agendas','updated_at','CRITICO','persistência'),

    -- agendamentos
    ('agendapro_public_booking_requests','id','CRITICO','id'),
    ('agendapro_public_booking_requests','agenda_id','CRITICO','agenda'),
    ('agendapro_public_booking_requests','account_id','CRITICO','dono antigo'),
    ('agendapro_public_booking_requests','client_account_id','IMPORTANTE','dono novo'),
    ('agendapro_public_booking_requests','company_id','CRITICO','empresa'),
    ('agendapro_public_booking_requests','agenda_slug','CRITICO','slug'),
    ('agendapro_public_booking_requests','business_name','CRITICO','negócio'),
    ('agendapro_public_booking_requests','client_name','IMPORTANTE','nome cliente alternativo'),
    ('agendapro_public_booking_requests','customer_name','CRITICO','cliente'),
    ('agendapro_public_booking_requests','customer_phone','CRITICO','telefone antigo'),
    ('agendapro_public_booking_requests','customer_whatsapp','IMPORTANTE','whatsapp novo'),
    ('agendapro_public_booking_requests','customer_email','CRITICO','email'),
    ('agendapro_public_booking_requests','customer_note','IMPORTANTE','observação nova'),
    ('agendapro_public_booking_requests','service_id','IMPORTANTE','serviço id'),
    ('agendapro_public_booking_requests','service_name','CRITICO','serviço'),
    ('agendapro_public_booking_requests','professional_id','IMPORTANTE','profissional id'),
    ('agendapro_public_booking_requests','professional_name','IMPORTANTE','profissional nome'),
    ('agendapro_public_booking_requests','requested_date','CRITICO','data'),
    ('agendapro_public_booking_requests','requested_time','CRITICO','hora'),
    ('agendapro_public_booking_requests','status','CRITICO','status'),
    ('agendapro_public_booking_requests','notes','CRITICO','notas antigas'),
    ('agendapro_public_booking_requests','internal_note','IMPORTANTE','nota interna'),
    ('agendapro_public_booking_requests','cancellation_reason','IMPORTANTE','cancelamento'),
    ('agendapro_public_booking_requests','reschedule_reason','IMPORTANTE','remarcação'),
    ('agendapro_public_booking_requests','previous_requested_date','IMPORTANTE','data anterior'),
    ('agendapro_public_booking_requests','previous_requested_time','IMPORTANTE','hora anterior'),
    ('agendapro_public_booking_requests','confirmed_at','IMPORTANTE','confirmado'),
    ('agendapro_public_booking_requests','cancelled_at','IMPORTANTE','cancelado'),
    ('agendapro_public_booking_requests','completed_at','IMPORTANTE','concluído'),
    ('agendapro_public_booking_requests','rescheduled_at','IMPORTANTE','remarcado'),
    ('agendapro_public_booking_requests','message_history','IMPORTANTE','histórico msg'),
    ('agendapro_public_booking_requests','communication_log','IMPORTANTE','log comunicação'),
    ('agendapro_public_booking_requests','action_history','IMPORTANTE','histórico ações'),
    ('agendapro_public_booking_requests','action_metadata','IMPORTANTE','metadata ações'),
    ('agendapro_public_booking_requests','metadata','CRITICO','metadata'),
    ('agendapro_public_booking_requests','created_at','CRITICO','datas'),
    ('agendapro_public_booking_requests','updated_at','CRITICO','persistência'),

    -- pagamentos manuais
    ('agendapro_manual_payment_requests','id','CRITICO','id'),
    ('agendapro_manual_payment_requests','account_id','CRITICO','conta antiga'),
    ('agendapro_manual_payment_requests','client_account_id','IMPORTANTE','conta nova'),
    ('agendapro_manual_payment_requests','company_id','CRITICO','empresa'),
    ('agendapro_manual_payment_requests','full_name','CRITICO','nome'),
    ('agendapro_manual_payment_requests','email','CRITICO','email'),
    ('agendapro_manual_payment_requests','whatsapp','CRITICO','whatsapp'),
    ('agendapro_manual_payment_requests','business_name','CRITICO','negócio'),
    ('agendapro_manual_payment_requests','plan_id','CRITICO','plano'),
    ('agendapro_manual_payment_requests','plan_name','CRITICO','nome plano'),
    ('agendapro_manual_payment_requests','amount','CRITICO','valor'),
    ('agendapro_manual_payment_requests','status','CRITICO','status'),
    ('agendapro_manual_payment_requests','include_implementation','CRITICO','implantação'),
    ('agendapro_manual_payment_requests','note','CRITICO','nota'),
    ('agendapro_manual_payment_requests','payment_link','CRITICO','link'),
    ('agendapro_manual_payment_requests','reviewed_at','CRITICO','revisado'),
    ('agendapro_manual_payment_requests','reviewed_by','IMPORTANTE','quem revisou'),
    ('agendapro_manual_payment_requests','review_note','CRITICO','nota revisão'),
    ('agendapro_manual_payment_requests','rejection_reason','IMPORTANTE','motivo reprovação'),
    ('agendapro_manual_payment_requests','adjustment_reason','IMPORTANTE','ajuste'),
    ('agendapro_manual_payment_requests','proof_url','IMPORTANTE','comprovante'),
    ('agendapro_manual_payment_requests','approved_by','IMPORTANTE','aprovador'),
    ('agendapro_manual_payment_requests','approved_at','IMPORTANTE','aprovado'),
    ('agendapro_manual_payment_requests','rejected_by','IMPORTANTE','reprovador'),
    ('agendapro_manual_payment_requests','rejected_at','IMPORTANTE','reprovado'),
    ('agendapro_manual_payment_requests','metadata','CRITICO','metadata'),
    ('agendapro_manual_payment_requests','created_at','CRITICO','datas'),
    ('agendapro_manual_payment_requests','updated_at','CRITICO','persistência'),

    -- logs
    ('agendapro_client_activity_logs','id','CRITICO','id'),
    ('agendapro_client_activity_logs','account_id','CRITICO','conta antiga'),
    ('agendapro_client_activity_logs','client_account_id','IMPORTANTE','conta nova'),
    ('agendapro_client_activity_logs','company_id','CRITICO','empresa'),
    ('agendapro_client_activity_logs','actor_email','IMPORTANTE','ator'),
    ('agendapro_client_activity_logs','action','CRITICO','ação'),
    ('agendapro_client_activity_logs','title','CRITICO','título antigo'),
    ('agendapro_client_activity_logs','description','CRITICO','descrição antiga'),
    ('agendapro_client_activity_logs','message','IMPORTANTE','mensagem nova'),
    ('agendapro_client_activity_logs','entity_type','IMPORTANTE','entidade'),
    ('agendapro_client_activity_logs','entity_id','IMPORTANTE','id entidade'),
    ('agendapro_client_activity_logs','severity','CRITICO','severidade'),
    ('agendapro_client_activity_logs','metadata','CRITICO','metadata'),
    ('agendapro_client_activity_logs','created_at','CRITICO','data'),

    ('agendapro_dev_audit_logs','id','CRITICO','id'),
    ('agendapro_dev_audit_logs','actor_email','CRITICO','ator'),
    ('agendapro_dev_audit_logs','actor_id','IMPORTANTE','ator id'),
    ('agendapro_dev_audit_logs','action','CRITICO','ação'),
    ('agendapro_dev_audit_logs','entity_type','CRITICO','entidade'),
    ('agendapro_dev_audit_logs','entity_id','CRITICO','id entidade'),
    ('agendapro_dev_audit_logs','severity','CRITICO','severidade'),
    ('agendapro_dev_audit_logs','description','CRITICO','descrição antiga'),
    ('agendapro_dev_audit_logs','message','IMPORTANTE','mensagem nova'),
    ('agendapro_dev_audit_logs','before_data','CRITICO','antes'),
    ('agendapro_dev_audit_logs','after_data','CRITICO','depois'),
    ('agendapro_dev_audit_logs','metadata','CRITICO','metadata'),
    ('agendapro_dev_audit_logs','created_at','CRITICO','data'),

    -- keys
    ('agendapro_license_keys','id','CRITICO','id'),
    ('agendapro_license_keys','key_hash','CRITICO','hash antigo'),
    ('agendapro_license_keys','key_prefix','CRITICO','prefixo antigo'),
    ('agendapro_license_keys','key_value','IMPORTANTE','key nova'),
    ('agendapro_license_keys','key_masked','IMPORTANTE','máscara nova'),
    ('agendapro_license_keys','type','CRITICO','tipo'),
    ('agendapro_license_keys','plan_id','CRITICO','plano'),
    ('agendapro_license_keys','plan_name','IMPORTANTE','nome plano'),
    ('agendapro_license_keys','duration_days','CRITICO','duração'),
    ('agendapro_license_keys','status','CRITICO','status'),
    ('agendapro_license_keys','max_uses','CRITICO','max usos'),
    ('agendapro_license_keys','uses_count','CRITICO','usos antigo'),
    ('agendapro_license_keys','used_count','IMPORTANTE','usos novo'),
    ('agendapro_license_keys','expires_at','CRITICO','expiração antiga'),
    ('agendapro_license_keys','valid_until','IMPORTANTE','validade nova'),
    ('agendapro_license_keys','revoked_at','IMPORTANTE','revogada'),
    ('agendapro_license_keys','activated_at','CRITICO','ativada'),
    ('agendapro_license_keys','activated_email','CRITICO','email ativação'),
    ('agendapro_license_keys','activated_business_name','CRITICO','negócio ativação'),
    ('agendapro_license_keys','created_by','IMPORTANTE','criada por'),
    ('agendapro_license_keys','linked_client_account_id','IMPORTANTE','conta vinculada'),
    ('agendapro_license_keys','linked_company_id','IMPORTANTE','empresa vinculada'),
    ('agendapro_license_keys','notes','CRITICO','notas antigas'),
    ('agendapro_license_keys','metadata','CRITICO','metadata'),
    ('agendapro_license_keys','created_at','CRITICO','datas'),
    ('agendapro_license_keys','updated_at','CRITICO','datas'),

    ('agendapro_license_key_redemptions','id','CRITICO','id'),
    ('agendapro_license_key_redemptions','license_key_id','CRITICO','licença'),
    ('agendapro_license_key_redemptions','account_id','CRITICO','conta antiga'),
    ('agendapro_license_key_redemptions','client_account_id','IMPORTANTE','conta nova'),
    ('agendapro_license_key_redemptions','company_id','CRITICO','empresa'),
    ('agendapro_license_key_redemptions','email','CRITICO','email'),
    ('agendapro_license_key_redemptions','business_name','CRITICO','negócio'),
    ('agendapro_license_key_redemptions','plan_id','CRITICO','plano'),
    ('agendapro_license_key_redemptions','status','CRITICO','status'),
    ('agendapro_license_key_redemptions','activated_at','CRITICO','ativação'),
    ('agendapro_license_key_redemptions','expires_at','CRITICO','expiração'),
    ('agendapro_license_key_redemptions','metadata','CRITICO','metadata'),
    ('agendapro_license_key_redemptions','created_at','CRITICO','data'),

    -- checkout/webhook/pagamentos
    ('agendapro_checkout_sessions','id','CRITICO','id'),
    ('agendapro_checkout_sessions','account_id','CRITICO','conta antiga'),
    ('agendapro_checkout_sessions','client_account_id','IMPORTANTE','conta nova'),
    ('agendapro_checkout_sessions','company_id','CRITICO','empresa'),
    ('agendapro_checkout_sessions','plan_id','CRITICO','plano'),
    ('agendapro_checkout_sessions','checkout_type','CRITICO','tipo'),
    ('agendapro_checkout_sessions','provider','CRITICO','provedor'),
    ('agendapro_checkout_sessions','external_reference','CRITICO','referência'),
    ('agendapro_checkout_sessions','payer_name','CRITICO','pagador'),
    ('agendapro_checkout_sessions','payer_email','CRITICO','email pagador'),
    ('agendapro_checkout_sessions','payer_phone','CRITICO','telefone pagador'),
    ('agendapro_checkout_sessions','business_name','CRITICO','negócio'),
    ('agendapro_checkout_sessions','business_slug','CRITICO','slug negócio'),
    ('agendapro_checkout_sessions','amount','CRITICO','valor'),
    ('agendapro_checkout_sessions','currency','CRITICO','moeda'),
    ('agendapro_checkout_sessions','status','CRITICO','status'),
    ('agendapro_checkout_sessions','success_url','CRITICO','url sucesso'),
    ('agendapro_checkout_sessions','pending_url','CRITICO','url pendente'),
    ('agendapro_checkout_sessions','failure_url','CRITICO','url erro'),
    ('agendapro_checkout_sessions','mp_preference_id','CRITICO','MP preference'),
    ('agendapro_checkout_sessions','mp_init_point','CRITICO','MP init'),
    ('agendapro_checkout_sessions','mp_sandbox_init_point','CRITICO','MP sandbox'),
    ('agendapro_checkout_sessions','mp_payment_id','CRITICO','MP payment'),
    ('agendapro_checkout_sessions','mp_collection_id','CRITICO','MP collection'),
    ('agendapro_checkout_sessions','mp_merchant_order_id','CRITICO','MP merchant order'),
    ('agendapro_checkout_sessions','metadata','CRITICO','metadata'),
    ('agendapro_checkout_sessions','created_at','CRITICO','datas'),
    ('agendapro_checkout_sessions','updated_at','CRITICO','datas'),

    ('agendapro_payment_webhook_events','id','CRITICO','id'),
    ('agendapro_payment_webhook_events','provider','CRITICO','provider'),
    ('agendapro_payment_webhook_events','event_id','CRITICO','id evento antigo'),
    ('agendapro_payment_webhook_events','event_type','CRITICO','tipo'),
    ('agendapro_payment_webhook_events','external_id','IMPORTANTE','id externo novo'),
    ('agendapro_payment_webhook_events','action','CRITICO','ação'),
    ('agendapro_payment_webhook_events','data_id','CRITICO','data id'),
    ('agendapro_payment_webhook_events','live_mode','CRITICO','live mode'),
    ('agendapro_payment_webhook_events','signature_valid','CRITICO','assinatura'),
    ('agendapro_payment_webhook_events','processed','CRITICO','processado antigo'),
    ('agendapro_payment_webhook_events','processed_at','CRITICO','processado em'),
    ('agendapro_payment_webhook_events','processing_error','CRITICO','erro antigo'),
    ('agendapro_payment_webhook_events','status','IMPORTANTE','status novo'),
    ('agendapro_payment_webhook_events','resolved','IMPORTANTE','resolvido novo'),
    ('agendapro_payment_webhook_events','payload','CRITICO','payload'),
    ('agendapro_payment_webhook_events','error_message','IMPORTANTE','erro novo'),
    ('agendapro_payment_webhook_events','resolved_at','IMPORTANTE','resolvido em'),
    ('agendapro_payment_webhook_events','resolved_by','IMPORTANTE','resolvido por'),
    ('agendapro_payment_webhook_events','reprocess_count','IMPORTANTE','reprocessamentos'),
    ('agendapro_payment_webhook_events','metadata','CRITICO','metadata'),
    ('agendapro_payment_webhook_events','created_at','CRITICO','data'),
    ('agendapro_payment_webhook_events','updated_at','CRITICO','data'),

    ('agendapro_payments','id','CRITICO','id'),
    ('agendapro_payments','checkout_session_id','CRITICO','checkout'),
    ('agendapro_payments','account_id','IMPORTANTE','conta antiga'),
    ('agendapro_payments','client_account_id','IMPORTANTE','conta nova'),
    ('agendapro_payments','company_id','IMPORTANTE','empresa'),
    ('agendapro_payments','external_reference','CRITICO','referência'),
    ('agendapro_payments','mp_payment_id','CRITICO','MP payment'),
    ('agendapro_payments','mp_preference_id','CRITICO','MP preference'),
    ('agendapro_payments','amount','CRITICO','valor'),
    ('agendapro_payments','currency','IMPORTANTE','moeda'),
    ('agendapro_payments','provider','CRITICO','provider'),
    ('agendapro_payments','status','CRITICO','status'),
    ('agendapro_payments','description','CRITICO','descrição'),
    ('agendapro_payments','payment_method_id','CRITICO','método'),
    ('agendapro_payments','payment_type_id','CRITICO','tipo'),
    ('agendapro_payments','payer_email','CRITICO','pagador'),
    ('agendapro_payments','installments','CRITICO','parcelas'),
    ('agendapro_payments','approved_at','CRITICO','aprovado'),
    ('agendapro_payments','paid_at','CRITICO','pago'),
    ('agendapro_payments','raw_response','CRITICO','resposta bruta'),
    ('agendapro_payments','metadata','IMPORTANTE','metadata'),
    ('agendapro_payments','created_at','CRITICO','data'),
    ('agendapro_payments','updated_at','CRITICO','data'),

    ('agendapro_subscriptions','id','CRITICO','id'),
    ('agendapro_subscriptions','checkout_session_id','CRITICO','checkout'),
    ('agendapro_subscriptions','account_id','IMPORTANTE','conta antiga'),
    ('agendapro_subscriptions','client_account_id','IMPORTANTE','conta nova'),
    ('agendapro_subscriptions','company_id','IMPORTANTE','empresa'),
    ('agendapro_subscriptions','plan_id','CRITICO','plano'),
    ('agendapro_subscriptions','plan_name','CRITICO','nome plano'),
    ('agendapro_subscriptions','status','CRITICO','status'),
    ('agendapro_subscriptions','external_reference','CRITICO','referência'),
    ('agendapro_subscriptions','started_at','CRITICO','início'),
    ('agendapro_subscriptions','current_period_end','CRITICO','fim período'),
    ('agendapro_subscriptions','metadata','CRITICO','metadata'),
    ('agendapro_subscriptions','created_at','CRITICO','data'),
    ('agendapro_subscriptions','updated_at','CRITICO','data'),

    ('agendapro_onboarding_sessions','id','CRITICO','id'),
    ('agendapro_onboarding_sessions','checkout_session_id','CRITICO','checkout'),
    ('agendapro_onboarding_sessions','account_id','IMPORTANTE','conta antiga'),
    ('agendapro_onboarding_sessions','client_account_id','IMPORTANTE','conta nova'),
    ('agendapro_onboarding_sessions','company_id','IMPORTANTE','empresa'),
    ('agendapro_onboarding_sessions','status','CRITICO','status'),
    ('agendapro_onboarding_sessions','current_step','CRITICO','etapa'),
    ('agendapro_onboarding_sessions','completed_steps','CRITICO','etapas concluídas'),
    ('agendapro_onboarding_sessions','readiness_score','CRITICO','score'),
    ('agendapro_onboarding_sessions','metadata','CRITICO','metadata'),
    ('agendapro_onboarding_sessions','created_at','CRITICO','data'),
    ('agendapro_onboarding_sessions','updated_at','CRITICO','data'),

    -- Central Dev extras
    ('agendapro_admin_settings','id','CRITICO','id'),
    ('agendapro_admin_settings','key','CRITICO','chave antiga'),
    ('agendapro_admin_settings','value','CRITICO','valor antigo'),
    ('agendapro_admin_settings','setting_key','IMPORTANTE','chave nova'),
    ('agendapro_admin_settings','setting_value','IMPORTANTE','valor novo'),
    ('agendapro_admin_settings','description','CRITICO','descrição'),
    ('agendapro_admin_settings','updated_by','CRITICO','atualizado por'),
    ('agendapro_admin_settings','created_at','CRITICO','data'),
    ('agendapro_admin_settings','updated_at','CRITICO','data'),

    ('agendapro_support_cases','id','CRITICO','id'),
    ('agendapro_support_cases','client_id','CRITICO','cliente antigo'),
    ('agendapro_support_cases','client_account_id','IMPORTANTE','cliente novo'),
    ('agendapro_support_cases','company_id','CRITICO','empresa'),
    ('agendapro_support_cases','agenda_id','CRITICO','agenda'),
    ('agendapro_support_cases','title','CRITICO','título'),
    ('agendapro_support_cases','description','CRITICO','descrição'),
    ('agendapro_support_cases','status','CRITICO','status'),
    ('agendapro_support_cases','priority','CRITICO','prioridade'),
    ('agendapro_support_cases','responsible_email','CRITICO','responsável antigo'),
    ('agendapro_support_cases','resolution','CRITICO','resolução antiga'),
    ('agendapro_support_cases','metadata','CRITICO','metadata'),
    ('agendapro_support_cases','created_at','CRITICO','data'),
    ('agendapro_support_cases','updated_at','CRITICO','data'),

    ('agendapro_support_notes','id','CRITICO','id'),
    ('agendapro_support_notes','entity_type','CRITICO','entidade antiga'),
    ('agendapro_support_notes','entity_id','CRITICO','id entidade antiga'),
    ('agendapro_support_notes','client_id','CRITICO','cliente antigo'),
    ('agendapro_support_notes','client_account_id','IMPORTANTE','cliente novo'),
    ('agendapro_support_notes','company_id','CRITICO','empresa'),
    ('agendapro_support_notes','agenda_id','CRITICO','agenda'),
    ('agendapro_support_notes','author_email','CRITICO','autor'),
    ('agendapro_support_notes','priority','CRITICO','prioridade antiga'),
    ('agendapro_support_notes','status','CRITICO','status antigo'),
    ('agendapro_support_notes','note','CRITICO','nota'),
    ('agendapro_support_notes','visibility','IMPORTANTE','visibilidade nova'),
    ('agendapro_support_notes','metadata','CRITICO','metadata'),
    ('agendapro_support_notes','created_at','CRITICO','data'),
    ('agendapro_support_notes','updated_at','IMPORTANTE','data'),

    ('agendapro_system_alerts','id','CRITICO','id'),
    ('agendapro_system_alerts','title','CRITICO','título'),
    ('agendapro_system_alerts','description','CRITICO','descrição antiga'),
    ('agendapro_system_alerts','message','IMPORTANTE','mensagem nova'),
    ('agendapro_system_alerts','severity','CRITICO','severidade'),
    ('agendapro_system_alerts','entity_type','CRITICO','entidade'),
    ('agendapro_system_alerts','entity_id','CRITICO','id entidade'),
    ('agendapro_system_alerts','status','CRITICO','status'),
    ('agendapro_system_alerts','assigned_to','CRITICO','responsável antigo'),
    ('agendapro_system_alerts','resolved_at','IMPORTANTE','resolvido'),
    ('agendapro_system_alerts','metadata','CRITICO','metadata'),
    ('agendapro_system_alerts','created_at','CRITICO','data'),
    ('agendapro_system_alerts','updated_at','CRITICO','data'),

    ('agendapro_internal_tasks','id','CRITICO','id'),
    ('agendapro_internal_tasks','title','CRITICO','título'),
    ('agendapro_internal_tasks','description','CRITICO','descrição antiga'),
    ('agendapro_internal_tasks','status','CRITICO','status'),
    ('agendapro_internal_tasks','priority','CRITICO','prioridade'),
    ('agendapro_internal_tasks','entity_type','CRITICO','entidade'),
    ('agendapro_internal_tasks','entity_id','CRITICO','id entidade'),
    ('agendapro_internal_tasks','assigned_to','CRITICO','responsável antigo'),
    ('agendapro_internal_tasks','assignee','IMPORTANTE','responsável novo'),
    ('agendapro_internal_tasks','due_at','CRITICO','prazo'),
    ('agendapro_internal_tasks','completed_at','IMPORTANTE','concluído'),
    ('agendapro_internal_tasks','metadata','CRITICO','metadata'),
    ('agendapro_internal_tasks','created_at','CRITICO','data'),
    ('agendapro_internal_tasks','updated_at','CRITICO','data'),

    -- access events
    ('agendapro_access_events','id','IMPORTANTE','id'),
    ('agendapro_access_events','account_id','IMPORTANTE','conta'),
    ('agendapro_access_events','company_id','IMPORTANTE','empresa'),
    ('agendapro_access_events','event_type','IMPORTANTE','tipo'),
    ('agendapro_access_events','access_key','IMPORTANTE','key'),
    ('agendapro_access_events','metadata','IMPORTANTE','metadata'),
    ('agendapro_access_events','created_at','IMPORTANTE','data')
)
select
  e.criticidade,
  e.table_name,
  e.column_name,
  case when c.column_name is not null then 'OK' else 'FALTANDO' end as status,
  coalesce(c.data_type, '-') as tipo_atual,
  e.motivo
from expected_columns e
left join information_schema.columns c
  on c.table_schema = 'public'
 and c.table_name = e.table_name
 and c.column_name = e.column_name
order by
  case
    when c.column_name is null and e.criticidade = 'CRITICO' then 0
    when c.column_name is null then 1
    else 2
  end,
  e.table_name,
  e.column_name;

-- ============================================================================
-- 3. RPCs/FUNÇÕES
-- ============================================================================

with expected_functions(function_name, criticidade, motivo) as (
  values
    ('agendapro_create_client_workspace','CRITICO','cadastro antigo chama /rpc/agendapro_create_client_workspace'),
    ('agendapro_set_updated_at','CRITICO','triggers antigos de updated_at'),
    ('agendapro_touch_booking_updated_at','IMPORTANTE','trigger da sprint de booking management')
)
select
  e.criticidade,
  e.function_name,
  case
    when exists (
      select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public'
        and p.proname = e.function_name
    ) then 'OK'
    else 'FALTANDO'
  end as status,
  e.motivo
from expected_functions e
order by
  case
    when not exists (
      select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public'
        and p.proname = e.function_name
    ) and e.criticidade = 'CRITICO' then 0
    when not exists (
      select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public'
        and p.proname = e.function_name
    ) then 1
    else 2
  end,
  e.function_name;

-- ============================================================================
-- 4. TABELAS FORA DO PREFIXO agendapro_ PARA CONFLITO COM OUTROS PROJETOS
-- ============================================================================

select
  table_schema,
  table_name,
  table_type
from information_schema.tables
where table_schema = 'public'
  and table_name not like 'agendapro_%'
order by table_name;

-- ============================================================================
-- 5. POSSÍVEIS CONFLITOS POR NOME
-- ============================================================================

select
  table_schema,
  table_name,
  'POSSIVEL_OUTRO_PROJETO_OU_CONFLITO_DE_NOME' as observacao
from information_schema.tables
where table_schema = 'public'
  and table_name not like 'agendapro_%'
  and (
    table_name ilike '%agenda%'
    or table_name ilike '%booking%'
    or table_name ilike '%appointment%'
    or table_name ilike '%client%'
    or table_name ilike '%customer%'
    or table_name ilike '%company%'
    or table_name ilike '%payment%'
    or table_name ilike '%license%'
    or table_name ilike '%key%'
    or table_name ilike '%webhook%'
    or table_name ilike '%subscription%'
    or table_name ilike '%checkout%'
    or table_name ilike '%log%'
  )
order by table_name;

-- ============================================================================
-- 6. RLS E POLICIES DAS TABELAS agendapro_
-- ============================================================================

select
  schemaname,
  tablename,
  rowsecurity as rls_ativo
from pg_tables
where schemaname = 'public'
  and tablename like 'agendapro_%'
order by tablename;

select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename like 'agendapro_%'
order by tablename, policyname;

-- ============================================================================
-- 7. SOMENTE ITENS FALTANDO
-- ============================================================================

with expected_tables(table_name, criticidade, motivo) as (
  values
    ('agendapro_client_accounts','CRITICO','login'),
    ('agendapro_companies','CRITICO','empresa'),
    ('agendapro_account_companies','CRITICO','vínculo legado'),
    ('agendapro_created_agendas','CRITICO','agenda'),
    ('agendapro_public_booking_requests','CRITICO','agendamentos'),
    ('agendapro_manual_payment_requests','CRITICO','pagamento manual'),
    ('agendapro_client_activity_logs','CRITICO','logs cliente'),
    ('agendapro_dev_audit_logs','CRITICO','logs dev'),
    ('agendapro_license_keys','CRITICO','keys'),
    ('agendapro_license_key_redemptions','CRITICO','redemptions'),
    ('agendapro_quick_briefings','CRITICO','briefings'),
    ('agendapro_payment_webhook_events','CRITICO','webhook'),
    ('agendapro_checkout_sessions','CRITICO','checkout'),
    ('agendapro_payments','CRITICO','payments'),
    ('agendapro_subscriptions','CRITICO','subscriptions'),
    ('agendapro_onboarding_sessions','CRITICO','onboarding'),
    ('agendapro_support_cases','CRITICO','suporte'),
    ('agendapro_support_notes','CRITICO','notas'),
    ('agendapro_admin_settings','CRITICO','settings'),
    ('agendapro_system_alerts','CRITICO','alertas'),
    ('agendapro_internal_tasks','CRITICO','tarefas'),
    ('agendapro_access_events','IMPORTANTE','eventos acesso')
),
expected_functions(function_name, criticidade, motivo) as (
  values
    ('agendapro_create_client_workspace','CRITICO','cadastro'),
    ('agendapro_set_updated_at','CRITICO','updated_at'),
    ('agendapro_touch_booking_updated_at','IMPORTANTE','booking updated_at')
),
expected_columns(table_name, column_name, criticidade) as (
  values
    ('agendapro_client_accounts','auth_user_id','CRITICO'),
    ('agendapro_client_accounts','plan','CRITICO'),
    ('agendapro_companies','owner_account_id','CRITICO'),
    ('agendapro_companies','current_plan_id','CRITICO'),
    ('agendapro_companies','plan_started_at','CRITICO'),
    ('agendapro_companies','plan_expires_at','CRITICO'),
    ('agendapro_account_companies','account_id','CRITICO'),
    ('agendapro_account_companies','company_id','CRITICO'),
    ('agendapro_account_companies','is_active','CRITICO'),
    ('agendapro_created_agendas','account_id','CRITICO'),
    ('agendapro_created_agendas','public_link','CRITICO'),
    ('agendapro_created_agendas','published','CRITICO'),
    ('agendapro_created_agendas','segment','CRITICO'),
    ('agendapro_created_agendas','description','CRITICO'),
    ('agendapro_created_agendas','theme','CRITICO'),
    ('agendapro_created_agendas','team','CRITICO'),
    ('agendapro_created_agendas','hours','CRITICO'),
    ('agendapro_created_agendas','rules','CRITICO'),
    ('agendapro_public_booking_requests','account_id','CRITICO'),
    ('agendapro_public_booking_requests','customer_phone','CRITICO'),
    ('agendapro_public_booking_requests','notes','CRITICO'),
    ('agendapro_manual_payment_requests','account_id','CRITICO'),
    ('agendapro_manual_payment_requests','review_note','CRITICO'),
    ('agendapro_manual_payment_requests','include_implementation','CRITICO'),
    ('agendapro_client_activity_logs','account_id','CRITICO'),
    ('agendapro_client_activity_logs','title','CRITICO'),
    ('agendapro_client_activity_logs','description','CRITICO'),
    ('agendapro_dev_audit_logs','description','CRITICO'),
    ('agendapro_dev_audit_logs','before_data','CRITICO'),
    ('agendapro_dev_audit_logs','after_data','CRITICO'),
    ('agendapro_license_keys','key_hash','CRITICO'),
    ('agendapro_license_keys','key_prefix','CRITICO'),
    ('agendapro_license_keys','type','CRITICO'),
    ('agendapro_license_keys','uses_count','CRITICO'),
    ('agendapro_license_keys','expires_at','CRITICO'),
    ('agendapro_license_key_redemptions','account_id','CRITICO'),
    ('agendapro_checkout_sessions','external_reference','CRITICO'),
    ('agendapro_checkout_sessions','mp_preference_id','CRITICO'),
    ('agendapro_checkout_sessions','mp_init_point','CRITICO'),
    ('agendapro_payment_webhook_events','event_id','CRITICO'),
    ('agendapro_payment_webhook_events','data_id','CRITICO'),
    ('agendapro_payment_webhook_events','processed','CRITICO'),
    ('agendapro_payment_webhook_events','processing_error','CRITICO'),
    ('agendapro_payments','mp_payment_id','CRITICO'),
    ('agendapro_subscriptions','checkout_session_id','CRITICO'),
    ('agendapro_onboarding_sessions','checkout_session_id','CRITICO'),
    ('agendapro_admin_settings','key','CRITICO'),
    ('agendapro_admin_settings','value','CRITICO'),
    ('agendapro_support_cases','client_id','CRITICO'),
    ('agendapro_support_cases','responsible_email','CRITICO'),
    ('agendapro_support_notes','client_id','CRITICO'),
    ('agendapro_system_alerts','description','CRITICO'),
    ('agendapro_internal_tasks','assigned_to','CRITICO')
),
missing_tables as (
  select 'TABELA' as tipo, table_name as item, criticidade
  from expected_tables e
  where not exists (
    select 1 from information_schema.tables t
    where t.table_schema='public' and t.table_name=e.table_name
  )
),
missing_functions as (
  select 'FUNCAO' as tipo, function_name as item, criticidade
  from expected_functions e
  where not exists (
    select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname=e.function_name
  )
),
missing_columns as (
  select 'COLUNA' as tipo, table_name || '.' || column_name as item, criticidade
  from expected_columns e
  where not exists (
    select 1 from information_schema.columns c
    where c.table_schema='public' and c.table_name=e.table_name and c.column_name=e.column_name
  )
)
select *
from (
  select * from missing_tables
  union all
  select * from missing_functions
  union all
  select * from missing_columns
) x
order by
  case when criticidade='CRITICO' then 0 else 1 end,
  tipo,
  item;

-- ============================================================================
-- 8. ENV VARS PARA CONFERIR MANUALMENTE NA VERCEL
-- ============================================================================

select *
from (
  values
    ('SUPABASE_URL','CRITICO_BACKEND','backend'),
    ('SUPABASE_SERVICE_ROLE_KEY','CRITICO_BACKEND','backend, bypass RLS'),
    ('SUPABASE_ANON_KEY','IMPORTANTE_BACKEND','auth/login fallback'),
    ('SUPABASE_PUBLISHABLE_KEY','IMPORTANTE_BACKEND','auth/login fallback'),
    ('CLIENT_SESSION_SECRET','IMPORTANTE_BACKEND','sessão cliente; se mudar, precisa login novamente'),
    ('DEV_ADMIN_EMAIL','CRITICO_DEV_BASE_ANTIGA','login dev antigo'),
    ('DEV_ADMIN_PASSWORD','CRITICO_DEV_BASE_ANTIGA','login dev antigo'),
    ('DEV_ADMIN_SECRET','CRITICO_DEV_BASE_ANTIGA','assinatura token dev e hash de keys'),
    ('DEV_ADMIN_TOKEN','IMPORTANTE_DEV_NOVO','somente se código novo usar token'),
    ('MERCADO_PAGO_ACCESS_TOKEN','CRITICO_PAGAMENTO','checkout/webhook'),
    ('MERCADO_PAGO_WEBHOOK_SECRET','IMPORTANTE_PAGAMENTO','assinatura webhook'),
    ('APP_URL','IMPORTANTE_BACKEND','URLs de retorno'),
    ('VITE_APP_URL','IMPORTANTE_FRONT','URLs de retorno front'),
    ('VITE_SUPABASE_URL','IMPORTANTE_FRONT','front'),
    ('VITE_SUPABASE_ANON_KEY','IMPORTANTE_FRONT','front'),
    ('VITE_SUPABASE_PUBLISHABLE_KEY','IMPORTANTE_FRONT','front'),
    ('VITE_AGENDAPRO_DEMO_URL','IMPORTANTE_FRONT','demo separada'),
    ('VITE_AGENDAPRO_DEFAULT_COMPANY_SLUG','IMPORTANTE_FRONT','bootstrap legado'),
    ('VITE_AGENDAPRO_ENABLE_REMOTE_BOOTSTRAP','IMPORTANTE_FRONT','deixar false em produção')
) as env(var_name, criticidade, motivo)
order by criticidade, var_name;
