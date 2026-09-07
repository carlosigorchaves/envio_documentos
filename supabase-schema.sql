-- Execute no Supabase: SQL Editor → New query → Run

CREATE TABLE IF NOT EXISTS colaboradores (
  id                   BIGSERIAL    PRIMARY KEY,
  lote_id              TEXT         NOT NULL,
  nome                 TEXT         NOT NULL,
  email                TEXT         NOT NULL,
  cpf                  TEXT,
  cargo                TEXT,
  extras               JSONB,
  document_id          TEXT,
  signature_public_id  TEXT,
  link_assinatura      TEXT,
  status               TEXT         NOT NULL DEFAULT 'pendente',
  enviado_em           TIMESTAMPTZ,
  visualizado_em       TIMESTAMPTZ,
  assinado_em          TIMESTAMPTZ,
  rejeitado_em         TIMESTAMPTZ,
  arquivo_assinado_url TEXT,
  created_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_col_lote      ON colaboradores (lote_id);
CREATE INDEX IF NOT EXISTS idx_col_email     ON colaboradores (email);
CREATE INDEX IF NOT EXISTS idx_col_doc       ON colaboradores (document_id);
CREATE INDEX IF NOT EXISTS idx_col_status    ON colaboradores (status);
