
t=false
while [[ "$#" -gt 0 ]]; do
	case $1 in
		--test) t=true ;;
	esac
	shift
done

if [ "$t" = false ]; then
	npx wp-env run cli wp db reset --yes
	npx wp-env run cli wp core install --url=http://localhost:8777 --title=DevSITE --admin_user=admin --admin_password=password --admin_email=admin@example.com
	npx wp-env run cli plugin activate coco-gravity-form-map-field gravityforms solar-project solar
else
	npx wp-env run tests-cli wp db reset --yes
	npx wp-env run tests-cli wp core install --url=http://localhost:8889 --title='"Mi Test Site WP"' --admin_user=admin --admin_password=password --admin_email=admin@example.com
	npx wp-env run tests-cli plugin activate coco-gravity-form-map-field gravityforms solar-project solar
fi
