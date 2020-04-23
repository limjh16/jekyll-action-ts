import * as core from '@actions/core'
import * as exec from '@actions/exec'
import {performance} from 'perf_hooks'

export async function measure<T>({
  name,
  block
}: {
  name: string
  block: () => Promise<T>
}): Promise<T> {
  return await core.group(name, async () => {
    const start = performance.now()
    try {
      return await block()
    } finally {
      const end = performance.now()
      const duration = (end - start) / 1000.0
      console.log(`Took ${duration.toFixed(2).padStart(6)} seconds`)
    }
  })
}

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
