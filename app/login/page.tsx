import { AuthPage } from "@/components/auth-page"
import { LoginForm } from "@/components/forms/login-form"

export default function LoginPage() {
  return (
    <AuthPage title="Qué bueno verte" description="Inicia sesión para consultar avisos y colaborar con la comunidad.">
      <LoginForm />
    </AuthPage>
  )
}
