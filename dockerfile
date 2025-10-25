# Usar Node.js LTS oficial
FROM node:20-slim

# Usuário root para instalar pacotes
USER root

# Instalar ffmpeg
RUN apt-get update && apt-get install -y ffmpeg && apt-get clean

# Criar diretório da aplicação
WORKDIR /usr/src/app

# Copiar package.json e package-lock.json
COPY package*.json ./

# Instalar dependências
RUN npm install --production

# Copiar o restante do código
COPY . .

# Expor a porta
EXPOSE 3001

# Comando para rodar a API
CMD ["node", "index.js"]
