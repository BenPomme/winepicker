declare module 'next' {
  export interface NextApiRequest {
    body: any;
    query: Record<string, string | string[]>;
    cookies: Record<string, string>;
    headers: Record<string, string | string[]>;
  }

  export interface NextApiResponse<T = any> {
    status(code: number): NextApiResponse<T>;
    json(data: T): void;
    send(data: T): void;
    redirect(url: string): void;
    redirect(status: number, url: string): void;
    setHeader(name: string, value: string | string[]): void;
    end(): void;
  }
} 