# Load environment variables
test-shell:
	export $$(cat .env.test | xargs) && bash

prod-shell:
	export $$(cat .env | xargs) && bash

# Build scripts
build-prod:
	docker compose --env-file .env -f docker-compose.yml build

build-test:
	docker compose --env-file .env.test -f docker-compose.yml -f docker-compose.test.yml build

# Normal start (fast, reuses images)
test-up:
	docker compose \
		--env-file .env.test \
		-f docker-compose.yml \
		-f docker-compose.test.yml \
		up -d

test-down:
	docker compose \
		--env-file .env.test \
		-f docker-compose.yml \
		-f docker-compose.test.yml \
		down -v

prod-up:
	docker compose \
		--env-file .env \
		-f docker-compose.yml \
		-f docker-compose.prod.yml \
		up -d

# Force rebuild + start (useful after code or Dockerfile changes)
test-rebuild:
	make build-test
	make test-up

prod-rebuild:
	make build-prod
	make prod-up

# Clean everything
down:
	docker compose down --remove-orphans

clean: down
	docker compose rm -fsv                                     # also removes stopped containers + volumes if you want
	# Optional: docker image prune -f                          # cleans dangling images (careful in shared environments)

# Watch logs (handy shortcut)
logs:
	docker compose logs -f