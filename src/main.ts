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
    let jekyllSrc = ''
    let myError = ''
    const options: ExecOptions = {}
    options.listeners = {
      stdout: (data: Buffer) => {
        jekyllSrc += data.toString()
      },
      stderr: (data: Buffer) => {
        myError += data.toString()
      }
    }

    const INPUT_JEKYLL_SRC = core.getInput('JEKYLL_SRC', {}),
      SRC = core.getInput('SRC', {})
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
          jekyllSrc = INPUT_JEKYLL_SRC
          core.debug(`Using parameter value ${jekyllSrc} as a source directory`)
        } else if (SRC) {
          jekyllSrc = SRC
          core.debug(
            `Using ${jekyllSrc} environment var value as a source directory`
          )
        } else {
          try {
            await exec.exec(
              'bash -c "find . -path ./vendor/bundle -prune -o -name _config.yml -exec dirname {} \\; | tr -d \'\n\'"',
              [],
              options
            )
          } catch (error) {
            core.debug(`error: ${error}`)
            core.debug(`myError: ${myError}`)
          }
        }
        core.debug(`Resolved ${jekyllSrc} as source directory`)
        core.exportVariable('JEKYLL_ENV', 'production')
        await exec.exec('echo "${JEKYLL_ENV}"') // debug
        return await exec.exec(`bundle exec jekyll build -s ${jekyllSrc}`)
      }
    })
  } catch (error) {
    core.setFailed(error.message)
  }
}
run()
