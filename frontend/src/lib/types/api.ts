export interface ApiValidationError {
  loc: (string | number)[];
  msg: string;
  type: string;
}

export interface ApiError {
  detail: string | ApiValidationError[];
}

export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
}
