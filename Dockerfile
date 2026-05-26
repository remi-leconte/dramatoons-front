FROM node:lts-alpine

WORKDIR /app

# 1. On copie les fichiers de définition des dépendances
COPY package*.json ./

# 2. On installe les dépendances définies dans ton projet
# (C'est cette étape qui te manquait)
RUN npm install

# 3. On copie tout le reste du code source
COPY . .

EXPOSE 5173

# Vite a besoin du flag --host pour accepter les connexions hors conteneur
CMD ["npm", "run", "dev"]
