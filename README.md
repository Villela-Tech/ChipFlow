# ChipFlow WhatsApp Connector

Projeto de gerenciamento de conexões de WhatsApp com API REST e interface React.

## Estrutura do Projeto

O projeto está organizado em duas partes principais:

- **backend/** - Servidor de API construído com Express.js para gerenciar conexões WhatsApp
- **react-app/** - Aplicação frontend construída com React para interagir com a API

## Backend

O backend gerencia múltiplas sessões WhatsApp. Os principais endpoints são:

- `/auth/login` - Autenticação
- `/whatsapp/connections` - Listagem de conexões
- `/whatsapp/connections/:id/reconnect` - Reconectar WhatsApp
- `/whatsapp/connections/:id/disconnect` - Desconectar WhatsApp

## Frontend

A aplicação frontend foi construída com React e oferece:

- Interface de usuário moderna com Tailwind CSS
- Autenticação com token JWT
- Gerenciamento do ciclo de vida das conexões
- Dashboard para monitoramento de status

## Instalação

### Backend

```bash
cd backend
npm install
npm start
```

### Frontend

```bash
cd react-app
npm install
npm start
```

## Configuração

Crie um arquivo `.env` na pasta `react-app` com:

```
REACT_APP_API_URL=http://localhost:3001/api
```

E um arquivo `.env` na pasta `backend` com as configurações do servidor.

## Licença

Este projeto está licenciado sob a Licença MIT.
