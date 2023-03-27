init:
	docker-compose -f compose.init.yml up -d --build
	docker-compose -f compose.init.yml exec app npm install
	docker-compose -f compose.init.yml stop
up:
	docker-compose up -d
	@make logs-watch
stop:
	docker-compose stop
down:
	docker-compose down --remove-orphans
restart:
	@make down
	@make up
ps:
	docker-compose ps
logs:
	docker-compose logs
logs-watch:
	docker-compose logs --follow