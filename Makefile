up:
	docker compose up -d --build

down:
	docker compose down

restart:
	docker compose down && docker compose up -d --build

logs:
	docker compose logs -f

sh-backend:
	docker exec -it app-backend sh

db-fresh:
	docker exec app-backend php artisan migrate:fresh --seed

test:
	docker exec app-backend php artisan test