import * as path from 'path';
import * as os from 'os';

export default class Config {
  static baseDir: string = path.join(os.homedir(), '.nssr');
  static libDir: string = path.join(Config.baseDir, 'lib');
  static serverDir: string = path.join(Config.baseDir, 'servers');
  static pidFile: string = path.join(Config.baseDir, 'nssr.pid');
  static logFile: string = path.join(Config.baseDir, 'nssr.log');
}
