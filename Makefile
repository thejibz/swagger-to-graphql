.PHONY : install push

install:
    #rm -rf .git 
 	#rm -f .gitignore 
	yarn run build

push:
	git status
	git add .
	git status
	git commit -m"[sync]"
	git push