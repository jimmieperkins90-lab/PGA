import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LoginForm from "./LoginForm";

export default async function LoginPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/");
  return (
    <div className="max-w-md mx-auto mt-10 bg-white border border-pine/15 rounded-lg p-6 shadow-sm">
      <h1 className="font-display text-2xl text-pine mb-1">Sign in</h1>
      <p className="text-sm text-ink/70 mb-4">
        Enter your email and we&apos;ll send you a one-tap sign-in link. No password, and you stay signed in on this device.
      </p>
      <LoginForm />
    </div>
  );
}
