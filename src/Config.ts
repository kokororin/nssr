import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

export default class Config {
  static baseDir: string = path.join(os.homedir(), '.nssr');
  static libDir: string = path.join(Config.baseDir, 'lib');
  static serverDir: string = path.join(Config.baseDir, 'servers');
  static pidFile: string = path.join(Config.baseDir, 'nssr.pid');
  static logFile: string = path.join(Config.baseDir, 'nssr.log');
  static configFile: string = path.join(Config.baseDir, 'nssr.json');
  static packageURL = 'https://raw.githubusercontent.com/kokororin/nssr/master/package.json';

  public get(key: string): any {
    if (fs.existsSync(Config.configFile)) {
      const config: any = JSON.parse(
        fs.readFileSync(Config.configFile).toString()
      );
      if (config.hasOwnProperty(key)) {
        return config[key];
      }
    }
    return null;
  }

  public set(key: string, value: any) {
    let config: any;
    if (fs.existsSync(Config.configFile)) {
      config = JSON.parse(fs.readFileSync(Config.configFile).toString());
    } else {
      config = {};
    }
    config[key] = value;
    fs.writeFileSync(Config.configFile, JSON.stringify(config, null, 2));
  }
}
