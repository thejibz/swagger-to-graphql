.PHONY : install push

install:
    #rm -rf .git 
 	#rm -f .gitignore 
	yarn run build

push:
	git add .
	git status
	git commit -m"[sync]" 
	git push

force_push:
	git add .
	git status
	git commit -m"[sync]"|| true  
	git push -f