export default class UserFixError extends Error {
  isUserFix: boolean;

  constructor( message: string ) {
    super( message );
    this.isUserFix = true;
    this.name = 'UserFixError';
  }
}
