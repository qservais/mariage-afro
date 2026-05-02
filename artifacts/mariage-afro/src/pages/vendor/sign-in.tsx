import { SignIn } from "@clerk/react";
import { basePath } from "@/lib/clerk";

export default function VendorSignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-wine-deep px-4 py-20">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <p className="text-[10px] uppercase tracking-[0.3em] text-gold mb-2">Espace Pro</p>
          <h1 className="text-cream font-display text-3xl">Mariage Afro</h1>
        </div>
        <SignIn
          routing="path"
          path={`${basePath}/espace-pro/login`}
          signUpUrl={`${basePath}/espace-pro/register`}
          fallbackRedirectUrl="/espace-pro"
        />
      </div>
    </div>
  );
}
