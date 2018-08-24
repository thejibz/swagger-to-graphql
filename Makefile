.PHONY : install push force_push

install:
    #rm -rf .git 
 	#rm -f .gitignore 
	yarn add babel babel-cli
	yarn run build

push:
	git add .
	git status
	git commit -m"[sync]" 
	git push

force_push:
	git add .
	git status
	git commit -m"[sync]"
	git push -f