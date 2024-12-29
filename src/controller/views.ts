// Python source reference:
// """
// Controller views.
// """
//
// class ControllerError(Exception):
// 	"""Controller error."""
//
// 	pass

export class ControllerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ControllerError';
  }
}
