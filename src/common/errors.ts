export default class UserFixError extends Error {
  readonly isUserFix = true;

  constructor( message: string ) {
    super( message );
    this.name = 'UserFixError';
  }
}
