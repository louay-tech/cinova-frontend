import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { loginFn } from "@/lib/gate.server";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await loginFn({ data: { password } });
      if (result.success) {
        window.location.href = "/library";
      } else {
        setError("كلمة المرور غير صحيحة");
      }
    } catch {
      setError("حدث خطأ، حاول مجدداً");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-4 text-center">
        <h1 className="text-2xl font-semibold">Cinova</h1>
        <p className="text-sm text-muted-foreground">هذا الموقع خاص، يرجى إدخال كلمة المرور</p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          className="w-full rounded-md border border-input bg-background px-4 py-2 text-center"
          placeholder="كلمة المرور"
          autoFocus
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
        >
          {loading ? "جارٍ التحقق..." : "دخول"}
        </button>
      </div>
    </div>
  );
}
