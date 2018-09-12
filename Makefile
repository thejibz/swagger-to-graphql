.PHONY : install push force_push

install:
	yarn add --dev babel-cli
	yarn run build
	rm -rf node_modules

push:
	git add .
	git status
	git commit -m"[sync]"|| true 
	git push

force_push:
	git add .
	git status
	git commit -m"[sync]"|| true 
	git push -f