export type PosErrorCode =
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "TABLE_OCCUPIED"
  | "TABLE_DOUBLE_BOOKED"
  | "ORDER_NOT_OPEN"
  | "RESERVATION_CLOSED"
  | "ITEM_UNAVAILABLE"
  | "INVALID_CREDENTIALS"
  | "RATE_LIMITED"
  | "VALIDATION";

const STATUS_BY_CODE: Record<PosErrorCode, number> = {
  NOT_FOUND: 404,
  FORBIDDEN: 403,
  TABLE_OCCUPIED: 409,
  TABLE_DOUBLE_BOOKED: 409,
  ORDER_NOT_OPEN: 409,
  RESERVATION_CLOSED: 409,
  ITEM_UNAVAILABLE: 409,
  INVALID_CREDENTIALS: 401,
  RATE_LIMITED: 429,
  VALIDATION: 422,
};

export class PosError extends Error {
  constructor(
    public readonly code: PosErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "PosError";
  }

  get status(): number {
    return STATUS_BY_CODE[this.code];
  }
}
