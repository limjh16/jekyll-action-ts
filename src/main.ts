import * as core from '@actions/core'
import * as exec from '@actions/exec'

async function run(): Promise<void> {
  try {
    core.startGroup('bundle install')
    await exec.exec('bash', ['scripts/bundle.sh'])
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
