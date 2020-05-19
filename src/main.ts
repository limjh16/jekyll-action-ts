import * as core from '@actions/core'
import * as exec from '@actions/exec'
import {measure} from './common'

async function run(): Promise<void> {
  try {
    await measure({
      name: 'bundle install',
      block: async () => {
        await exec.exec(
          `bundle config path ${process.env.GITHUB_WORKSPACE}/vendor/bundle`
        )
        return await exec.exec(
          `bundle install --jobs=4 --gemfile=${core.getState('gemSrc')}`
        )
      }
    })

    await measure({
      name: 'jekyll build',
      block: async () => {
        core.exportVariable('JEKYLL_ENV', 'production')
        return await exec.exec(
          `bundle exec jekyll build -s ${core.getState('jekyllSrc')}`
        )
      }
    })
  } catch (error) {
    core.setFailed(error.message)
  }
}
run()
