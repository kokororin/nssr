import * as util from 'util';
import chalk from 'chalk';
import * as PrettyError from 'pretty-error';

export default class Logger {
  private prettyError: PrettyError;

  public constructor() {
    this.prettyError = new PrettyError();
    this.prettyError.start();
  }

  public info(...args: Array<any>): void {
    const msg = util.format.apply(util.format, args);
    console.log(chalk.white(`  ${msg}`));
  }

  public warning(...args: Array<any>): void {
    const msg = util.format.apply(util.format, args);
    console.log(chalk.yellow(`  ${msg}`));
  }
}
