import to from 'await-to-js'
import * as childProcess from 'child_process'

import { DAEMON_CONFIG_DEFAULT } from '../constants'

/**
 * Look for running Electra daemons via their P2P port 5718 and return the result.
 */
export default async function(): Promise<{ isRunning: boolean, output?: string }> {
  const [err, output] = process.platform === 'win32'
    // https://ss64.com/nt/findstr.html
    ? await to(exec(`netstat -a -n -o | findstr LISTENING | findstr :${DAEMON_CONFIG_DEFAULT.port}`))
    : await to(exec(`lsof -n -i4TCP:${DAEMON_CONFIG_DEFAULT.port} | grep LISTEN`))

  return {
    isRunning: err === null && typeof output === 'string' && output.length !== 0,
    output,
  }
}

/**
 * Execute a command in a child process.
 */
async function exec(command: string): Promise<string> {
  return new Promise((resolve: (stdout: string) => void, reject: (err: Error) => void): void => {
    const childProcessInstance: childProcess.ChildProcess = childProcess.exec(
      command,
      (err: Error | null, stdout: string, stderr: string): void => {
        childProcessInstance.kill()

        if (err !== null || stderr.length !== 0) {
          reject(err !== null ? err : new Error(stderr))

          return
        }

        resolve(stdout)
      }
    )
  })
}
