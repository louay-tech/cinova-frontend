import { createServerFn } from "@tanstack/react-start";
import { getCookie, setCookie } from "@tanstack/react-start/server";

const API_BASE_URL = "https://cinova-api.onrender.com";
const COOKIE_NAME = "cinova_gate";
const COOKIE_VALUE = "granted";

export const checkGateFn = createServerFn({ method: "GET" }).handler(async () => {
  const value = getCookie(COOKIE_NAME);
  return { authorized: value === COOKIE_VALUE };
});

export const loginFn = createServerFn({ method: "POST" })
  .validator((data: { password: string }) => data)
  .handler(async ({ data }) => {
    const response = await fetch(`${API_BASE_URL}/verify-gate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: data.password }),
    });

    if (!response.ok) {
      return { success: false };
    }

    const result = await response.json();
    if (result.success) {
      setCookie(COOKIE_NAME, COOKIE_VALUE, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30,
        path: "/",
      });
      return { success: true };
    }
    return { success: false };
  });
