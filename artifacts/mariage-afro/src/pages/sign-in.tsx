import { SignIn } from "@clerk/react";
import { basePath } from "@/lib/clerk";

export default function SignInPage() {
  // To update login providers, app branding, or OAuth settings use the Auth
  // pane in the workspace toolbar. More information can be found in the Replit docs.
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-20">
      <div className="w-full max-w-md">
        <SignIn
          routing="path"
          path={`${basePath}/espace-client/login`}
          signUpUrl={`${basePath}/espace-client/register`}
          fallbackRedirectUrl="/espace-client"
        />
      </div>
    </div>
  );
}
