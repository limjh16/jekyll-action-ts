import * as core from '@actions/core'
import * as exec from '@actions/exec'
import {measure} from './common'
import {ExecOptions} from '@actions/exec/lib/interfaces'
/**
 * @todo Catch error outputs
 * @body Seems like GitHub Actions has some powerful tools to help catch unexpected errors
 * https://github.com/actions/toolkit/tree/master/packages/exec#outputoptions
 * https://github.com/actions/toolkit/blob/master/docs/problem-matchers.md
 */
async function run(): Promise<void> {
  try {
    let myOutput = ''
    let myError = ''
    const options: ExecOptions = {}
    options.listeners = {
      stdout: (data: Buffer) => {
        myOutput += data.toString()
      },
      stderr: (data: Buffer) => {
        myError += data.toString()
      }
    }

    core.setSecret('JEKYLL_PAT')
    core.setSecret('process.env.JEKYLL_PAT')
    const INPUT_JEKYLL_SRC = core.getInput('INPUT_JEKYLL_SRC', {}),
      SRC = core.getInput('SRC', {})
    let GITHUB_REPOSITORY: string,
      GITHUB_REF: string,
      GITHUB_ACTOR: string,
      GITHUB_SHA: string,
      JEKYLL_PAT: string
    if (typeof process.env.GITHUB_REPOSITORY === 'string') {
      GITHUB_REPOSITORY = process.env.GITHUB_REPOSITORY
    } else {
      core.error('process.env.GITHUB_REPOSITORY is not a string!')
    }
    if (typeof process.env.GITHUB_REF === 'string') {
      GITHUB_REF = process.env.GITHUB_REF
    } else {
      core.error('process.env.GITHUB_REF is not a string!')
    }
    if (typeof process.env.GITHUB_ACTOR === 'string') {
      GITHUB_ACTOR = process.env.GITHUB_ACTOR
    } else {
      core.error('process.env.GITHUB_REPOSGITHUB_ACTORITORY is not a string!')
    }
    if (typeof process.env.GITHUB_SHA === 'string') {
      GITHUB_SHA = process.env.GITHUB_SHA
    } else {
      core.error('process.env.GITHUB_SHA is not a string!')
    }
    if (typeof process.env.JEKYLL_PAT === 'string') {
      JEKYLL_PAT = process.env.JEKYLL_PAT
    } else {
      core.error('process.env.JEKYLL_PAT is not a string!')
    }
    /**
     * @todo expose GITHUB_ACTOR, GITHUB_REPOSITORY and remoteBranch for user to set in actions
     */
    await measure({
      name: 'bundle install',
      block: async () => {
        await exec.exec('bundle config path vendor/bundle')
        return await exec.exec('bundle install --jobs 4 --retry 3')
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
          try {
            await exec.exec(
              'find . -path ./vendor/bundle -prune -o -name "_config.yml" -exec dirname {} ;',
              [],
              options
            )
          } catch (error) {
            core.debug(`error: ${error}`)
            core.debug(`myError: ${myError}`)
          }
          core.exportVariable('JEKYLL_SRC', myOutput)
        }
        core.debug(`Resolved ${myOutput} as source directory`)
        return await exec.exec(
          `bundle exec jekyll build -s ${myOutput} -d build`
        )
      }
    })
    await measure({
      name: 'git push',
      block: async () => {
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
        await exec.exec(`cd build \
        && touch .nojekyll \
        && git init \
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
