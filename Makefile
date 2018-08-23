.PHONY : install push

install:
	rm -rf .git 
	rm -f .gitignore 
	npm install
	yarn run build

push:
	git status
	git add .
	git status
	git commit -m"[sync]"
	git push