.PHONY: help build up down logs bash migrate test clean

help:
	@echo "Hogar Geriátrico - Comandos disponibles:"
	@echo ""
	@echo "Instalación y Setup:"
	@echo "  make init          - Inicializar el proyecto (crear .env, construir imágenes)"
	@echo "  make build         - Construir imágenes Docker"
	@echo ""
	@echo "Ejecutar:"
	@echo "  make up            - Iniciar todos los servicios (Laravel + MySQL + Nginx)"
	@echo "  make down          - Detener todos los servicios"
	@echo "  make restart       - Reiniciar todos los servicios"
	@echo ""
	@echo "Logs:"
	@echo "  make logs          - Ver logs combinados"
	@echo "  make logs-app      - Ver logs del contenedor Laravel"
	@echo "  make logs-db       - Ver logs de la BD"
	@echo "  make logs-frontend - Ver logs del frontend"
	@echo ""
	@echo "Acceso:"
	@echo "  make bash          - Acceder al contenedor del backend"
	@echo "  make shell-db      - Acceder a la consola de MySQL"
	@echo ""
	@echo "Laravel:"
	@echo "  make migrate       - Ejecutar migraciones (artisan)"
	@echo "  make test          - Ejecutar pruebas (phpunit)"
	@echo ""
	@echo "Limpieza:"
	@echo "  make clean         - Limpiar contenedores y volúmenes"
	@echo "  make clean-hard    - Eliminar todo incluyendo .env"

init:
	@bash scripts/init.sh

build:
	docker-compose build

up:
	docker-compose up -d
	@echo "✓ Servicios iniciados"
	@echo "  Frontend: http://localhost"
	@echo "  Backend: http://localhost:8000"
	@echo "  Admin: http://localhost:8000/admin"

down:
	docker-compose down

restart: down up
	@echo "✓ Servicios reiniciados"

logs:
	docker-compose logs -f

logs-app:
	docker-compose logs -f app

logs-db:
	docker-compose logs -f db

logs-frontend:
	docker-compose logs -f frontend

bash:
	docker-compose exec app bash

shell-db:
	docker-compose exec db mysql -u root -p

migrate:
	docker-compose exec app php artisan migrate --force

# Laravel tests (phpunit)
test:
	docker-compose exec app php artisan test

clean:
	docker-compose down
	docker system prune -f

clean-hard:
	docker-compose down -v
	docker system prune -af
	rm -f .env

.env:
	cp .env.example .env
	@echo "✓ Archivo .env creado"
