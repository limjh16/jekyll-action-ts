#!/bin/bash
set -e
if [[ ${INPUT_JEKYLL_SRC} ]]; then
  JEKYLL_SRC=${INPUT_JEKYLL_SRC}
  echo "::debug ::Using parameter value $JEKYLL_SRC as a source directory"
elif [[ ${SRC} ]]; then
  JEKYLL_SRC=${SRC}
  echo "::debug ::Using SRC environment var value $JEKYLL_SRC as a source directory"
else
  JEKYLL_SRC=$(find . -path ./vendor/bundle -prune -o -name '_config.yml' -exec dirname {} \;)
  echo "::debug ::Resolved $JEKYLL_SRC as a source directory"
fi
bundle exec jekyll build -s $JEKYLL_SRC -d build
exit 0