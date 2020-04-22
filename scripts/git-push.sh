#!/bin/bash
set -e
cd build
touch .nojekyll
if [[ "${GITHUB_REPOSITORY}" == *".github.io"* ]]; then
	remote_branch="master"
else
	remote_branch="gh-pages"
	# @todo allow users to select which branch to push to, or docs/ in master branch
fi
if [ "${GITHUB_REF}" == "refs/heads/${remote_branch}" ]; then
	echo "Cannot publish on branch ${remote_branch}"
	exit 1
fi
# @todo allow users choose who is the github actor, not sure if that is possible though
echo "Publishing to ${GITHUB_REPOSITORY} on branch ${remote_branch}"
remote_repo="https://${JEKYLL_PAT}@github.com/${GITHUB_REPOSITORY}.git"
git init
git config user.name "${GITHUB_ACTOR}"
git config user.email "${GITHUB_ACTOR}@users.noreply.github.com"
git add .
git commit -m "jekyll build from Action ${GITHUB_SHA}"
git push --force $remote_repo master:$remote_branch
rm -fr .git
cd ..
exit 0