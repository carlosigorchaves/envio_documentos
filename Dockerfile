FROM python:3.11-slim

# Instala dependências do sistema
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    tesseract-ocr-por \
    pdftk \
    poppler-utils \
    && rm -rf /var/lib/apt/lists/*

# Instala Node.js 20
RUN apt-get update && apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Instala dependências Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Instala dependências Node
COPY package.json .
RUN npm install

# Copia código
COPY . .

EXPOSE 3002

CMD ["node", "server.js"]
