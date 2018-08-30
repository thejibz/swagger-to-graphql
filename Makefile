.PHONY : install push force_push

install:
	yarn add babel babel-cli
	yarn run build

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