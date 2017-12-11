export default class Validator {
  static isDomain(input: string): boolean {
    return /^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]).)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9-]*[A-Za-z0-9])$/.test(
      input
    );
  }

  static isIpAddress(input: string): boolean {
    return /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5]).){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/.test(
      input
    );
  }

  static isPort(input: string | number): boolean {
    return Number(input) >= 1 && Number(input) <= 65535;
  }
}
