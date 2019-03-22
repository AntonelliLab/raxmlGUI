export default class RAXMLError extends Error {
  constructor(...params) {
    super(...params);

    // Maintains proper stack trace for where this error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, RAXMLError);
    }

    // Custom debugging information
    this.date = new Date();
  }
}
