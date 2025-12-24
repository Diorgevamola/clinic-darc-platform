# AllService AI - Dashboard de Gerenciamento de Leads

<p align="center">
  <img src="public/logo.png" alt="AllService AI Logo" width="200"/>
</p>

## 📋 Sobre o Projeto

O **AllService AI Dashboard** é uma plataforma moderna de gerenciamento de leads desenvolvida para escritórios de advocacia. A plataforma integra-se com o WhatsApp via **Uazapi** para comunicação em tempo real com clientes e utiliza o **Supabase** como backend para armazenamento de dados.

### ✨ Principais Funcionalidades

- **📊 Dashboard Analítico**: Visualização de KPIs, gráfico de funil de leads e taxa de conversão por etapa
- **👥 Gerenciamento de Leads**: Tabela completa com filtros por script, status e data
- **💬 Chat em Tempo Real**: Integração com WhatsApp via Uazapi com atualização automática
- **🎨 Tema Premium**: Interface dark mode com efeitos neon e gradientes modernos

---

## 🚀 Tecnologias Utilizadas

| Tecnologia | Descrição |
|------------|-----------|
| **Next.js 14** | Framework React com App Router |
| **TypeScript** | Tipagem estática para JavaScript |
| **Tailwind CSS** | Framework CSS utilitário |
| **Shadcn/ui** | Componentes UI reutilizáveis |
| **Recharts** | Biblioteca de gráficos |
| **Supabase** | Backend-as-a-Service (PostgreSQL) |
| **Uazapi** | API de integração WhatsApp |
| **date-fns** | Manipulação de datas |

---

## 📁 Estrutura do Projeto

```
dashboard/
├── public/                     # Arquivos estáticos
│   └── logo.png               # Logo da plataforma
├── src/
│   ├── app/                   # Páginas e rotas (App Router)
│   │   ├── (dashboard)/       # Layout protegido do dashboard
│   │   │   ├── page.tsx       # Página principal (Dashboard)
│   │   │   ├── leads/         # Gerenciamento de leads
│   │   │   ├── chats/         # Chat com clientes
│   │   │   └── profile/       # Perfil do usuário
│   │   ├── login/             # Página de login
│   │   ├── actions.ts         # Server Actions de autenticação
│   │   ├── globals.css        # Estilos globais e tema
│   │   └── layout.tsx         # Layout raiz
│   ├── components/
│   │   ├── dashboard/         # Componentes do dashboard
│   │   │   ├── FunnelChart.tsx
│   │   │   └── StepConversionChart.tsx
│   │   ├── layout/
│   │   │   └── Sidebar.tsx    # Navegação lateral
│   │   └── ui/                # Componentes Shadcn/ui
│   ├── lib/
│   │   ├── api.ts             # Funções de API e estatísticas
│   │   ├── supabase.ts        # Cliente Supabase
│   │   ├── uazapi.ts          # Tipos e interfaces Uazapi
│   │   └── utils.ts           # Utilitários gerais
│   └── middleware.ts          # Proteção de rotas
├── .env.local                 # Variáveis de ambiente
├── package.json               # Dependências
└── tsconfig.json              # Configuração TypeScript
```

---

## ⚙️ Configuração e Instalação

### Pré-requisitos

- Node.js 18+ 
- npm ou yarn
- Conta no Supabase
- Credenciais Uazapi

### 1. Clone o Repositório

```bash
git clone https://github.com/Diorgevamola/Allservice_advogados.git
cd dashboard
```

### 2. Instale as Dependências

```bash
npm install
```

### 3. Configure as Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon
```

### 4. Configure o Supabase

Crie a tabela `numero_dos_atendentes` com as colunas:

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid | Chave primária |
| `telefone` | text | Número do atendente (login) |
| `nome` | text | Nome do atendente |
| `token_uazapi` | text | Token de autenticação Uazapi |
| `url_uazapi` | text | URL da instância Uazapi |

### 5. Execute o Projeto

```bash
npm run dev
```

Acesse: `http://localhost:3000`

---

## 📱 Páginas da Plataforma

### 🔐 Login (`/login`)
- Autenticação por número de telefone
- Sessão armazenada em cookie seguro

### 📊 Dashboard (`/`)
- **Cards de Estatísticas**: Total, Qualificados, Desqualificados
- **Gráfico de Funil**: Visualização da progressão de leads (T1-T12)
- **Taxa de Conversão**: Percentual de conversão entre etapas
- **Filtros**: Por script e período

### 👥 Leads (`/leads`)
- **Tabela Completa**: Nome, telefone, status, data
- **Filtros Avançados**: Script, status, data
- **Paginação**: 100, 500, 1000 ou todos os registros
- **Badges de Status**: Qualificado, Em andamento, Desqualificado

### 💬 Chats (`/chats`)
- **Lista de Conversas**: Sidebar com busca e paginação
- **Visualização de Mensagens**: Suporte a texto, áudio, imagem, vídeo
- **Atualização em Tempo Real**: Polling a cada 3 segundos
- **Indicadores de Mídia**: Ícones para tipos de mensagem

### 👤 Perfil (`/profile`)
- Informações do usuário logado

---

## 🔄 Integração Uazapi

A plataforma utiliza os seguintes endpoints da Uazapi:

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/chat/find` | POST | Lista conversas |
| `/message/find` | POST | Busca mensagens de um chat |

### Exemplo de Requisição

```typescript
const response = await fetch(`${url}/chat/find`, {
  method: 'POST',
  headers: {
    'token': token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    limit: 100,
    sort: "-wa_lastMsgTimestamp"
  })
});
```

---

## 🎨 Sistema de Design

### Paleta de Cores

```css
--background: 0 0% 0%;           /* Preto puro */
--primary: 142 100% 50%;          /* Verde neon */
--secondary: 210 100% 50%;        /* Azul neon */
--accent: 280 100% 60%;           /* Roxo neon */
```

### Efeitos Visuais
- **Glassmorphism**: Cards translúcidos com blur
- **Gradientes Neon**: Bordas e destaques luminosos
- **Animações Suaves**: Transições e hovers

---

## 🛠️ Scripts Disponíveis

```bash
npm run dev      # Servidor de desenvolvimento
npm run build    # Build de produção
npm run start    # Servidor de produção
npm run lint     # Verificação de código
```

---

## 📦 Dependências Principais

```json
{
  "next": "15.1.0",
  "react": "^19.0.0",
  "tailwindcss": "^3.4.17",
  "@radix-ui/react-*": "Componentes acessíveis",
  "recharts": "^2.15.0",
  "@supabase/supabase-js": "^2.47.14",
  "date-fns": "^4.1.0"
}
```

---

## 🔒 Segurança

- **Autenticação**: Baseada em sessão com cookies HTTP-only
- **Middleware**: Proteção de rotas no servidor
- **Server Actions**: Operações sensíveis executadas no backend
- **Credenciais**: Tokens armazenados no Supabase, não no cliente

---

## 🚧 Melhorias Futuras

- [ ] Envio de mensagens pelo chat
- [ ] WebSocket para atualizações instantâneas
- [ ] Exportação de relatórios em PDF
- [ ] Dashboard customizável
- [ ] Integração com mais CRMs

---

## 👥 Contribuição

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

---

## 📄 Licença

Este projeto é proprietário da **AllService AI**. Todos os direitos reservados.

---

## 📞 Suporte

Para suporte técnico, entre em contato com a equipe de desenvolvimento.

---

<p align="center">
  Desenvolvido com ❤️ por <strong>AllService AI</strong>
</p>
