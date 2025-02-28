export class ServerError extends Error {
  constructor(
    message: string,
    public status: number = 400,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'ServerError';
  }

  toResponse() {
    return {
      message: this.message,
      status: this.status
    }
  }
}