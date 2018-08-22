.PHONY : install

install:
	rm -rf .git 
	rm -f .gitignore 
	npm install -g
	npm run build
