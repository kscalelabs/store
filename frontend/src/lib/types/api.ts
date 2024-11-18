// API types
export interface ApiValidationError {
  loc: (string | number)[];
  msg: string;
  type: string;
}

export interface ApiError {
  status: number;
  message: string;
  detail: string | ApiValidationError[];
}

export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
}
