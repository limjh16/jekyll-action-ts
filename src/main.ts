import * as core from '@actions/core'
import * as exec from '@actions/exec'
import {measure} from './measure'

async function run(): Promise<void> {
  try {
    measure({
      name: 'bundle install',
      block: async () => exec.exec('bash scripts/bundle.sh')
    })
    /**
     * @todo Catch error outputs
     * @body Seems like GitHub Actions has some powerful tools to help catch unexpected errors
     * https://github.com/actions/toolkit/tree/master/packages/exec#outputoptions
     * https://github.com/actions/toolkit/blob/master/docs/problem-matchers.md
     */
    measure({
      name: 'jekyll build',
      block: async () => exec.exec('bash scripts/jekyll.sh')
    })
    measure({
      name: 'git push',
      block: async () => exec.exec('bash scripts/git-push.sh')
    })
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
