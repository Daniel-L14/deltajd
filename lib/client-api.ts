export class RequestError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}
export async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      ...(init?.body && !(init.body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });
  const data = await response.json().catch(() => null);
  if (!response.ok)
    throw new RequestError(
      data?.error ?? "No se pudo completar la operación.",
      response.status,
    );
  if (data === null)
    throw new Error("El servidor respondió con un formato inesperado.");
  return data as T;
}
