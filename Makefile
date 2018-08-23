.PHONY : install

install:
	rm -rf .git 
	rm -f .gitignore 
	npm install --no-bin-links
	yarn run build
