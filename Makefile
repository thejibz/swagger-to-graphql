.PHONY : install

install:
	rm -rf .git 
	rm -f .gitignore 
	npm install
	npm run build
