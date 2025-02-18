class ServerError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ServerError';
    this.status = status;
  }

  toResponse() {
    return {
      message: this.message,
      status: this.status
    }
  }
}

export { ServerError };