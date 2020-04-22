import * as cp from 'child_process'
import * as path from 'path'

// shows how the runner will run a javascript action with env / stdout protocol
test('test runs', () => {
  const ip = path.join(__dirname, '..', 'lib', 'main.js')
  console.log(cp.execSync(`node ${ip}`).toString())
})
