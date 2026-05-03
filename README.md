# Discord Guard 🛡️

Bot de moderação para Discord com detecção de palavras proibidas em **texto** e **voz** (via Whisper STT).

## Funcionalidades

- ✅ Moderação de mensagens de texto em tempo real
- ✅ Gravação de áudio em canais de voz
- ✅ Transcrição via Whisper (Groq API)
- ✅ Aviso no DM do usuário
- ✅ Log em canal de moderação com embed
- ✅ Slash commands para controle de voz
- ✅ Serviço systemd com restart automático

## Pré-requisitos

- Node.js 20+
- pnpm
- ffmpeg instalado no sistema
- Conta na [Groq](https://console.groq.com) (gratuita, para Whisper)

```bash
# Debian/Ubuntu
apt install ffmpeg

# Arch Linux
pacman -S ffmpeg
```

## Configuração

### 1. Instalar dependências

```bash
pnpm install
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
# Edite o arquivo .env com seus valores
```

### 3. Configurar o bot no Discord Developer Portal

#### 3.1 Criar a aplicação

1. Acesse o [Discord Developer Portal](https://discord.com/developers/applications) e clique em **New Application**
2. Dê um nome à aplicação e clique em **Create**
3. Na aba **General Information**, copie o **Application ID** — esse é o `CLIENT_ID` do `.env`

#### 3.2 Criar o bot e obter o token

1. No menu lateral, clique em **Bot**
2. Clique em **Add Bot** → **Yes, do it!**
3. Em **Token**, clique em **Reset Token** → copie e guarde o valor — esse é o `DISCORD_TOKEN` do `.env`
   > ⚠️ O token só é exibido uma vez. Guarde-o em local seguro e nunca o compartilhe.
4. Desative **Public Bot** se não quiser que outras pessoas adicionem o bot a outros servidores

#### 3.3 Ativar os Privileged Gateway Intents

Ainda na aba **Bot**, role até **Privileged Gateway Intents** e ative:

| Intent | Motivo |
|---|---|
| **Server Members Intent** | Necessário para eventos de membros |
| **Message Content Intent** | Necessário para ler o conteúdo das mensagens e moderar texto |

Clique em **Save Changes**.

#### 3.4 Gerar o link de convite (OAuth2)

1. No menu lateral, clique em **OAuth2** → **URL Generator**
2. Em **Scopes**, marque:
   - `bot`
   - `applications.commands`
3. Em **Bot Permissions**, marque:

   | Categoria | Permissões |
   |---|---|
   | Texto | Read Messages/View Channels, Send Messages, Manage Messages, Embed Links, Read Message History |
   | Voz | Connect, Speak |
   | Geral | Use Slash Commands |

4. Copie a URL gerada na parte inferior e abra no navegador para adicionar o bot ao seu servidor

### 4. Registrar os slash commands

```bash
pnpm build
node dist/deploy-commands.js
```

### 5. Editar palavras proibidas

Edite o arquivo `src/utils/words.ts` e adicione suas palavras/frases na lista `BANNED_WORDS`.

### 6. Rodar em desenvolvimento

```bash
pnpm dev
```

## Deploy com systemd

### 1. Criar usuário dedicado

O serviço roda sob o usuário `packetloss`. Crie-o com um diretório home dedicado:

```bash
# Criar o usuário com home directory e shell bloqueado
useradd --create-home --shell /usr/sbin/nologin packetloss

# (Opcional) Definir uma senha caso precise de acesso interativo
passwd packetloss
```

> O diretório home do usuário será `/home/packetloss`. O bot ficará em `/home/packetloss/packetguard`.

### 2. Instalar pnpm para o usuário

O serviço usa `~/.local/share/pnpm` para executar o bot. Instale o pnpm no contexto do usuário:

```bash
# Alternar para o usuário packetloss
su - packetloss -s /bin/bash

# Instalar pnpm via script oficial
curl -fsSL https://get.pnpm.io/install.sh | sh -

# Sair de volta para root
exit
```

### 3. Copiar arquivos

```bash
mkdir -p /home/packetloss/packetguard
cp -r . /home/packetloss/packetguard
cd /home/packetloss/packetguard

su - packetloss -s /bin/bash -c "cd /home/packetloss/packetguard && pnpm install --prod && pnpm build"

mkdir -p recordings logs
chown -R packetloss:packetloss /home/packetloss/packetguard
```

### 4. Configurar o .env de produção

```bash
cp .env.example /home/packetloss/packetguard/.env
nano /home/packetloss/packetguard/.env
chmod 600 /home/packetloss/packetguard/.env
chown packetloss:packetloss /home/packetloss/packetguard/.env
```

### 5. Instalar e ativar o serviço

```bash
cp files/packetguard.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable packetguard
systemctl start packetguard
```

### 6. Verificar logs

```bash
journalctl -u packetguard -f
```

## Slash Commands

| Comando | Descrição |
|---|---|
| `/guard-join #canal` | Bot entra no canal e monitora o áudio |
| `/guard-leave` | Bot sai do canal de voz |
| `/guard-status` | Status atual do monitoramento |

> Todos os comandos requerem permissão **Manage Server**.

## Estrutura do projeto

```
discord-guard/
├── src/
│   ├── handlers/
│   │   ├── commands.ts   # Slash commands
│   │   ├── text.ts       # Moderação de texto
│   │   └── voice.ts      # Gravação e monitoramento de voz
│   ├── services/
│   │   ├── moderation.ts # Warn + log embeds
│   │   └── transcription.ts # ffmpeg + Groq Whisper
│   ├── utils/
│   │   ├── logger.ts     # Logger simples para journald
│   │   └── words.ts      # Lista de palavras proibidas
│   ├── config.ts         # Configuração centralizada
│   ├── deploy-commands.ts
│   └── index.ts          # Entry point
├── discord-guard.service # Unidade systemd
├── .env.example
├── package.json
└── tsconfig.json
```
