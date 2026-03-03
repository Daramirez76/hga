# Dockerfile para el backend Django
FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

WORKDIR /app/backend

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    python3-dev \
    default-libmysqlclient-dev \
    default-mysql-client \
    pkg-config \
    build-essential \
    && rm -rf /var/lib/apt/lists/*
    

# Copiar y instalar dependencias de Python
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar aplicación
COPY backend/ .

# Recolectar archivos estáticos (si es necesario)
RUN mkdir -p /app/backend/staticfiles

EXPOSE 8000

# Comando para ejecutar la aplicación
CMD ["gunicorn", "hga.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "4"]