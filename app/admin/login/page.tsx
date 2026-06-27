"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";

const schema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password required"),
});
type FormData = z.infer<typeof schema>;

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    setLoading(true);
    setError(null);
    const result = await signIn("credentials", {
      redirect: false,
      email: data.email,
      password: data.password,
    });
    setLoading(false);
    if (result?.error) {
      setError("Invalid email or password.");
    } else {
      router.push("/admin");
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6 text-blue-600" />
          </div>
          <h1 className="font-sans text-3xl font-bold text-gray-900">Admin Login</h1>
          <p className="text-gray-400 text-sm mt-2">Daddy's Kitchen</p>
        </div>
        <div className="bg-white border border-gray-100 shadow-sm rounded-xl p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="admin@daddysweekendspecial.com" {...register("email")} />
              {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="••••••••" {...register("password")} />
              {errors.password && <p className="text-red-500 text-xs">{errors.password.message}</p>}
            </div>
            {error && (
              <div className="bg-red-50 border border-red-100 rounded-lg p-3 text-red-600 text-sm">{error}</div>
            )}
            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
