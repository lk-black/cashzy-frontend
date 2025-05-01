# Etapa 1: Build da aplicação
FROM node:20 AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Etapa 2: Servir a aplicação com Nginx
FROM nginx:alpine

# Copiar o build do React para o diretório padrão do nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar arquivo customizado de configuração do Nginx (opcional)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expor a porta padrão do Nginx
EXPOSE 80

# Comando para iniciar o Nginx
CMD ["nginx", "-g", "daemon off;"]
