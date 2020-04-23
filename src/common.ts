import * as core from '@actions/core'
import {performance} from 'perf_hooks'
export async function measure<T>({
  name,
  block
}: {
  name: string
  block: () => Promise<T>
}): Promise<void> {
  return await core.group(name, async () => {
    const start = performance.now()
    try {
      await block()
    } catch (error) {
      core.setFailed(error.message)
    } finally {
      const end = performance.now()
      const duration = (end - start) / 1000.0
      console.log(`Took ${duration.toFixed(2).padStart(6)} seconds`)
    }
  })
}

export function match({str, rule}: {str: string; rule: string}) {
  // for this solution to work on any string, no matter what characters it has
  var escapeRegex = (str: string) =>
    str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, '\\$1')

  // "."  => Find a single character, except newline or line terminator
  // ".*" => Matches any string that contains zero or more characters
  rule = rule
    .split('*')
    .map(escapeRegex)
    .join('.*')

  // "^"  => Matches any string with the following at the beginning of it
  // "$"  => Matches any string with that in front at the end of it
  rule = '^' + rule + '$'

  //Create a regular expression object for matching string
  var regex = new RegExp(rule)

  //Returns true if it finds a match, otherwise it returns false
  return regex.test(str)
}
