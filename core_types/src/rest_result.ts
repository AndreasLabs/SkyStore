export interface RestResult<T> {
    data: T;
    details: string | null;
    message: string;
}

export const makeRestResult = <T>(data: T, message: string, details: string | null = null): RestResult<T> => {
    return {
        data,
        message,
        details
    }
}