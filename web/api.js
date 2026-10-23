export async function api(path, body, method) {
  let response;
  try {
    response = await fetch("/api" + path, {
      method: method || (body ? "POST" : "GET"),
      headers: body
        ? { "Content-Type": "application/json", "X-Ellis-Request": "1" }
        : {},
      credentials: "same-origin",
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error(
      "Connection failed. Your changes have not been saved. Retry when connected.",
    );
  }
  const data = await response
    .json()
    .catch(() => ({ error: "The server is unavailable. Please retry." }));
  if (!response.ok) {
    const e = new Error(data.error);
    e.status = response.status;
    throw e;
  }
  return data;
}
