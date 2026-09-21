declare module 'mssql' {
  export interface config {
    server: string;
    database: string;
    user: string;
    password: string;
    port?: number;
    options?: {
      encrypt?: boolean;
      trustServerCertificate?: boolean;
      enableArithAbort?: boolean;
      connectTimeout?: number;
    };
    pool?: {
      max?: number;
      min?: number;
      idleTimeoutMillis?: number;
    };
  }

  export interface IConnectionConfig {
    server: string;
    database: string;
    user: string;
    password: string;
    port?: number;
    options?: {
      encrypt?: boolean;
      trustServerCertificate?: boolean;
      enableArithAbort?: boolean;
      connectTimeout?: number;
    };
    pool?: {
      max?: number;
      min?: number;
      idleTimeoutMillis?: number;
    };
  }

  export const Int: any;
  export const NVarChar: any;
  export const Bit: any;
  export const BigInt: any;
  export const Float: any;
  export const DateTime: any;

  export class ConnectionPool {
    constructor(config: IConnectionConfig);
    connect(): Promise<ConnectionPool>;
    close(): Promise<void>;
    request(): Request;
  }

  export class Request {
    input(name: string, type: any, value: any): Request;
    query(command: string): Promise<IResult<any>>;
    execute(command: string): Promise<IResult<any>>;
    timeout: number;
  }

  export interface IResult<T> {
    recordset: T[];
    rowsAffected: number[];
  }

  export function connect(config: IConnectionConfig): Promise<ConnectionPool>;

  export default {
    ConnectionPool,
    Request,
    connect,
    Int,
    NVarChar,
    Bit,
    BigInt,
    Float,
    DateTime,
  };
}
