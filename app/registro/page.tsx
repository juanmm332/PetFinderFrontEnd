import { AuthPage } from "@/components/auth-page"
import { RegisterForm } from "@/components/forms/register-form"

export default function RegisterPage() {
  return (
    <AuthPage title="Únete a la comunidad" description="Crea una cuenta para registrar mascotas, publicar avisos y compartir información.">
      <RegisterForm />
    </AuthPage>
  )
}
