/** Cross-platform direct execution check: URL pathnames are not OS filesystem paths. */
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

export function isDirectModuleRun(moduleUrl, argvPath) {
  return typeof argvPath === 'string' && argvPath.length > 0 &&
    fileURLToPath(moduleUrl) === resolve(argvPath);
}
