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
    <div className="max-w-md mx-auto mt-6 bg-white border border-pine/15 rounded-lg p-6 shadow-sm">
      <LoginForm />
    </div>
  );
}
