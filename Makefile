.PHONY : install

install:
	rm -rf .git 
	rm -f .gitignore 
	yarn install --no-bin-links
	yarn run build
