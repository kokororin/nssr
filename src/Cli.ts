import * as program from 'commander';
import * as pkg from 'pjson';
import * as path from 'path';
import * as cp from 'child_process';
import * as fs from 'fs-extra';
import * as util from 'util';
import * as inquirer from 'inquirer';
import chalk from 'chalk';
import * as ora from 'ora';
import * as glob from 'glob';
import * as download from 'download-git-repo';
import * as PrettyError from 'pretty-error';
import Config from './Config';
import Validator from './Validator';

export = class Cli {
  private prettyError: PrettyError;

  public constructor() {
    this.prettyError = new PrettyError();
  }

  public register(): void {
    program
      .version(pkg.version)
      .command('init', 'initialize nssr')
      .command('add', 'add a server')
      .command('delete [server]', 'delete a server')
      .command('list', 'list servers')
      .command('start [server]', 'start server')
      .command('stop [server]', 'stop server')
      .parse(process.argv);
  }

  public async init(): Promise<any> {
    const answers = await inquirer.prompt({
      type: 'confirm',
      name: 'initialize',
      message: `Do you want to initialize${this.hasInit() ? ' again:' : ':'}`,
      default: true
    });

    if (answers.initialize) {
      fs.removeSync(Config.baseDir);
      fs.mkdir(Config.baseDir);
      fs.mkdir(Config.serverDir);
      const spinner = ora(`downloading library to ${Config.libDir}`);
      spinner.start();
      download(
        'shadowsocksr-backup/shadowsocksr#manyuser',
        Config.libDir,
        { clone: false },
        (err: any) => {
          spinner.stop();
          if (err) {
            this.logError(err);
          } else {
            this.logInfo(`initialized to ${Config.baseDir}`);
          }
        }
      );
    }
  }

  public async add(): Promise<any> {
    if (!this.checkInit()) {
      return;
    }

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'server_name',
        message: 'Friendly server name:',
        validate: (input: string) =>
          input.trim() !== '' && input === path.basename(input)
      },
      {
        type: 'input',
        name: 'server',
        message: 'Server IP or domain:',
        validate: (input: string) =>
          Validator.isIpAddress(input) || Validator.isDomain(input)
      },
      {
        type: 'input',
        name: 'server_port',
        message: 'Server port:',
        validate: (input: string) => Validator.isPort(input)
      },
      {
        type: 'input',
        name: 'local_address',
        message: 'Local address:',
        default: '127.0.0.1',
        validate: (input: string) => Validator.isIpAddress(input)
      },
      {
        type: 'input',
        name: 'local_port',
        message: 'Local port:',
        default: 1080,
        validate: (input: string) => Validator.isPort(input)
      },
      {
        type: 'password',
        name: 'password',
        message: 'Password:',
        validate: (input: string) => input.length > 0
      },
      {
        type: 'list',
        name: 'method',
        message: 'Method:',
        choices: [
          'none',
          'aes-256-cfb',
          'aes-192-cfb',
          'aes-128-cfb',
          'aes-256-cfb8',
          'aes-192-cfb8',
          'aes-128-cfb8',
          'aes-256-ctr',
          'aes-192-ctr',
          'aes-128-ctr',
          'chacha20-ietf',
          'chacha20',
          'rc4-md5',
          'rc4-md5-6'
        ],
        default: 'none'
      },
      {
        type: 'list',
        name: 'protocol',
        message: 'Protocol:',
        choices: [
          'origin',
          'verify_deflate',
          'auth_sha1_v4',
          'auth_sha1_v4_compatible',
          'auth_aes128_md5',
          'auth_aes128_sha1',
          'auth_chain_a',
          'auth_chain_b'
        ],
        default: 'origin'
      },
      {
        type: 'input',
        name: 'protocol_param',
        message: 'Protocol param:',
        default: ''
      },
      {
        type: 'list',
        name: 'obfs',
        message: 'Obfs:',
        choices: [
          'plain',
          'http_simple',
          'http_simple_compatible',
          'http_post',
          'http_post_compatible',
          'tls1.2_ticket_auth',
          'tls1.2_ticket_auth_compatible',
          'tls1.2_ticket_fastauth',
          'tls1.2_ticket_fastauth_compatible'
        ],
        default: 'plain'
      },
      {
        type: 'input',
        name: 'obfs_param',
        message: 'Obfs param:',
        default: ''
      }
    ]);

    answers.local_port = Number(answers.local_port);
    answers.server_port = Number(answers.server_port);

    const serverConfigPath = path.join(
      Config.serverDir,
      `${answers.server_name}.json`
    );
    delete answers.server_name;
    try {
      fs.writeFileSync(serverConfigPath, JSON.stringify(answers, null, 4));
      this.logInfo(`create server to ${serverConfigPath}`);
    } catch (e) {
      this.logError(e);
    }
  }

  public async start(): Promise<any> {
    if (!this.checkInit()) {
      return;
    }

    program.parse(process.argv);

    if (program.argv.length === 0) {
      try {
        const answers = await this.listServers();

        cp.execSync(this.buildCmd(answers.server, 'start'));
      } catch (e) {}
    } else {
      cp.execSync(this.buildCmd(process.argv[0], 'start'));
    }
  }

  public async stop(): Promise<any> {
    if (!this.checkInit()) {
      return;
    }

    try {
      const answers = await this.listServers();

      cp.execSync(this.buildCmd(answers.server, 'stop'));
    } catch (e) {}
  }

  private hasInit(): boolean {
    if (!fs.existsSync(Config.baseDir)) {
      return false;
    }
    if (!fs.existsSync(Config.libDir)) {
      return false;
    }
    return true;
  }

  private checkInit(): boolean {
    if (!this.hasInit()) {
      this.logWarning('please initialize before use');
      return false;
    }

    return true;
  }

  private listServers(): Promise<any> {
    return new Promise((resolve, reject) => {
      glob(
        path.join(Config.serverDir, '*.json'),
        async (err, files: Array<string>) => {
          if (err) {
            return reject(err);
          }
          if (files.length === 0) {
            this.logWarning('no config found');
          } else {
            const answers = await inquirer.prompt({
              type: 'list',
              name: 'server',
              message: 'Choose server:',
              choices: files.map(file => {
                return {
                  name: path.basename(file, '.json'),
                  value: file
                };
              })
            });
            resolve(answers);
          }
        }
      );
    });
  }

  private buildCmd(server: string, daemon: string): string {
    return `${path.join(Config.libDir, 'shadowsocks', 'local.py')} -c ${
      server
    } --pid-file ${Config.pidFile} --log-file ${Config.logFile} -d ${daemon}`;
  }

  private logInfo(...args: Array<any>): void {
    const msg = util.format.apply(util.format, args);
    console.log(chalk.white(`  ${msg}`));
  }

  private logWarning(...args: Array<any>): void {
    const msg = util.format.apply(util.format, args);
    console.log(chalk.yellow(`  ${msg}`));
  }

  private logError(err: Error): void {
    console.log(this.prettyError.render(err));
    process.exit(1);
  }
};
