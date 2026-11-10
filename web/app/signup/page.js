import AuthForm from "@/components/AuthForm";

export const metadata = { title: "Create account | yourshelf" };

export default function SignupPage() {
  return <AuthForm mode="signup" />;
}
