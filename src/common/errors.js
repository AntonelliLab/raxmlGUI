export default class UserFixError extends Error {
  constructor(message) {
    super(message);
    this.name = "UserFixError";
    this.isUserFix = true;
  }
}

