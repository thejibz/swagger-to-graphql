.PHONY : install

install:
	rm -rf .git 
	rm -f .gitignore 
	yarn install
	yarn run build
