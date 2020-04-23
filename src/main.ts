import * as core from '@actions/core'
import * as exec from '@actions/exec'
import {measure} from './common'
/**
 * @todo Catch error outputs
 * @body Seems like GitHub Actions has some powerful tools to help catch unexpected errors
 * https://github.com/actions/toolkit/tree/master/packages/exec#outputoptions
 * https://github.com/actions/toolkit/blob/master/docs/problem-matchers.md
 */
async function run(): Promise<void> {
  try {
    core.setSecret('JEKYLL_PAT')
    const INPUT_JEKYLL_SRC = core.getInput('INPUT_JEKYLL_SRC', {}),
      SRC = core.getInput('SRC', {}),
      GITHUB_REPOSITORY = core.getInput('GITHUB_REPOSITORY', {required: true}),
      GITHUB_REF = core.getInput('GITHUB_REF', {required: true}),
      GITHUB_ACTOR = core.getInput('GITHUB_ACTOR', {required: true}),
      GITHUB_SHA = core.getInput('GITHUB_SHA', {required: true}),
      JEKYLL_PAT = core.getInput('JEKYLL_PAT', {required: true})
    /**
     * @todo expose GITHUB_ACTOR, GITHUB_REPOSITORY and remoteBranch for user to set in actions
     */
    await measure({
      name: 'bundle install',
      block: async () => {
        return await exec.exec(
          'bundle config path vendor/bundle && bundle install --jobs 4 --retry 3'
        )
      }
    })
    await measure({
      name: 'jekyll build',
      block: async () => {
        core.debug(INPUT_JEKYLL_SRC)
        core.debug(SRC)
        if (INPUT_JEKYLL_SRC) {
          core.exportVariable('JEKYLL_SRC', INPUT_JEKYLL_SRC)
          core.debug(
            `Using parameter value ${INPUT_JEKYLL_SRC} as a source directory`
          )
        } else if (SRC) {
          core.exportVariable('JEKYLL_SRC', SRC)
          core.debug(`Using ${SRC} environment var value as a source directory`)
        } else {
          await exec.exec(
            "JEKYLL_SRC=$(find . -path ./vendor/bundle -prune -o -name '_config.yml' -exec dirname {} ;)"
          )
        }
        await exec.exec(
          'echo "::debug ::Resolved $JEKYLL_SRC as source directory"'
        )
        return await exec.exec(
          'bundle exec jekyll build -s $JEKYLL_SRC -d build'
        )
      }
    })
    await measure({
      name: 'git push',
      block: async () => {
        await exec.exec('cd build && touch .nojekyll')
        let remoteBranch: string
        if (GITHUB_REPOSITORY.match('/^*github.io$/')) {
          remoteBranch = 'master'
        } else {
          remoteBranch = 'gh-pages'
        }
        if (GITHUB_REF === `refs/heads/${remoteBranch}`) {
          core.error(`Cannot publish on branch ${remoteBranch}`)
        }
        core.debug(
          `Publishing to ${GITHUB_REPOSITORY} on branch ${remoteBranch}`
        )
        const remoteRepo = `https://${JEKYLL_PAT}@github.com/${GITHUB_REPOSITORY}.git`
        await exec.exec(`git init \
        && git config user.name "${GITHUB_ACTOR}" \
        && git config user.email "${GITHUB_ACTOR}@users.noreply.github.com" \
        && git add . \
        && git commit -m "jekyll build from Action ${GITHUB_SHA}" \
        && git push --force ${remoteRepo} master:${remoteBranch} \
        && rm -fr .git \
        && cd ..`)
        return await exec.exec('bash scripts/git-push.sh')
      }
    })
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
