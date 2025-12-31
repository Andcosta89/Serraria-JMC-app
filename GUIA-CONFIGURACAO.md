# 🪵 Serraria App - Guia de Configuração

Siga este guia passo a passo para configurar o banco de dados no Supabase.

---

## Passo 1: Executar o Script SQL

1. No Supabase, vá em **SQL Editor** (menu lateral esquerdo)
2. Clique em **New query**
3. Copie e cole o conteúdo do arquivo `setup-database.sql`
4. Clique em **Run** (ou pressione Ctrl+Enter)

> ✅ Isso criará as tabelas: `usuarios`, `servicos`, `pagamentos` e o bucket de fotos.

---

## Passo 2: Criar os Usuários

1. Vá em **Authentication** > **Users**
2. Clique em **Add user** > **Create new user**
3. Crie cada usuário abaixo:

| Email | Senha | Quem é |
|-------|-------|--------|
| admin@serraria.com | admin123 | Você (Andre Costa) |
| cleirton@serraria.com | cleirton123 | Marceneiro |
| dede@serraria.com | dede123 | Marceneiro |
| rodrigo@serraria.com | rodrigo123 | Marceneiro |
| joselio@serraria.com | joselio123 | Marceneiro |

> ⚠️ Marque a opção **"Auto Confirm User"** ou desative a confirmação por email.

---

## Passo 3: Vincular Usuários à Tabela

Após criar os 5 usuários:

1. Ainda em **Authentication** > **Users**, copie o **UUID** de cada usuário
2. Vá em **SQL Editor** > **New query**
3. Execute o script abaixo, substituindo os UUIDs:

```sql
INSERT INTO usuarios (auth_id, nome, email, tipo) VALUES
('UUID_DO_ADMIN', 'Andre Costa', 'admin@serraria.com', 'admin'),
('UUID_DO_CLEIRTON', 'Cleirton', 'cleirton@serraria.com', 'marceneiro'),
('UUID_DO_DEDE', 'Dedé', 'dede@serraria.com', 'marceneiro'),
('UUID_DO_RODRIGO', 'Rodrigo', 'rodrigo@serraria.com', 'marceneiro'),
('UUID_DO_JOSELIO', 'Joselio', 'joselio@serraria.com', 'marceneiro');
```

---

## Passo 4: Testar a Aplicação

1. Abra o arquivo `index.html` no navegador
2. Faça login com `admin@serraria.com` / `admin123`

---

## Credenciais de Acesso

### Admin (Andre Costa)
- **Email:** admin@serraria.com
- **Senha:** admin123

### Marceneiros
| Nome | Email | Senha |
|------|-------|-------|
| Cleirton | cleirton@serraria.com | cleirton123 |
| Dedé | dede@serraria.com | dede123 |
| Rodrigo | rodrigo@serraria.com | rodrigo123 |
| Joselio | joselio@serraria.com | joselio123 |

---

## Estrutura de Arquivos

```
serraria-app/
├── index.html          # Página principal
├── index.css           # Estilos
├── main.js             # Lógica da aplicação
├── api.js              # Comunicação com Supabase
├── config.js           # Configurações
├── setup-database.sql  # Script do banco
└── GUIA-CONFIGURACAO.md # Este guia
```
