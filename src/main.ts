import * as core from '@actions/core'
import * as exec from '@actions/exec'

async function run(): Promise<void> {
  try {
    core.startGroup('bundle install')
    await exec.exec('bash scripts/bundle.sh')
    /**
     * @todo Cache bundler files using @actions/tool-cache
     * @body This provides more flexibility over using actions/cache@v1,
     * since bundler may update some Gemfile files but are unable to edit Gemfile.lock.
     * https://github.com/actions/toolkit/tree/master/packages/tool-cache
     */
    /**
     * @todo Catch error outputs
     * @body Seems like GitHub Actions has some powerful tools to help catch unexpected errors
     * https://github.com/actions/toolkit/tree/master/packages/exec#outputoptions
     * https://github.com/actions/toolkit/blob/master/docs/problem-matchers.md
     */
    core.endGroup
    core.startGroup('jekyll build')
    await exec.exec('bash scripts/jekyll.sh')
    core.endGroup
    core.startGroup('git push')
    await exec.exec('bash scripts/git-push.sh')
    core.endGroup
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
