export default class UserFixError extends Error {
  constructor( message ) {
    super( message );
    this.isUserFix = true;
    this.name = 'UserFixError';
  }
}
