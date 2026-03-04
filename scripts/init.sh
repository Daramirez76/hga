#!/bin/bash

# Script de iniciación para el proyecto Hogar Geriátrico
# Uso: bash scripts/init.sh

set -e

echo "🚀 Inicializando proyecto Hogar Geriátrico..."

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # Sin color

# 1. Verificar Docker
echo -e "${BLUE}▶ Verificando Docker...${NC}"
if ! command -v docker &> /dev/null; then
    echo "❌ Docker no está instalado"
    exit 1
fi
echo -e "${GREEN}✓ Docker encontrado${NC}"

# 2. Verificar Docker Compose
echo -e "${BLUE}▶ Verificando Docker Compose...${NC}"
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose no está instalado"
    exit 1
fi
echo -e "${GREEN}✓ Docker Compose encontrado${NC}"

# 3. Crear archivo .env
echo -e "${BLUE}▶ Configurando variables de entorno...${NC}"
if [ ! -f .env ]; then
    cp .env.example .env
    echo -e "${GREEN}✓ Archivo .env creado (edítalo si es necesario)${NC}"
else
    echo -e "${YELLOW}⚠ Archivo .env ya existe${NC}"
fi

# 4. Crear directorio de scripts
if [ ! -d scripts ]; then
    mkdir -p scripts
fi

# 5. Construir imágenes
echo -e "${BLUE}▶ Construyendo imágenes Docker...${NC}"
docker-compose build

echo ""
echo -e "${GREEN}✓ ¡Construcción completada!${NC}"
echo ""
echo -e "${YELLOW}Próximos pasos:${NC}"
echo "1. Edita .env si necesitas cambiar la configuración"
echo "2. Ejecuta: ${BLUE}docker-compose up${NC}"
echo "3. Accede a:"
echo "   - Frontend: http://localhost"
echo "   - Admin (Laravel): http://localhost:8000/admin"
echo ""
echo -e "${YELLOW}Comandos útiles:${NC}"
echo "  docker-compose logs -f app    # Ver logs del contenedor Laravel"
echo "  docker-compose exec app bash  # Acceder al contenedor Laravel"
echo "  docker-compose down               # Detener servicios"
echo ""
