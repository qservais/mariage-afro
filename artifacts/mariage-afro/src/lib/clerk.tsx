import { useEffect, useRef, type ReactNode } from "react";
import { ClerkProvider, useClerk, useAuth } from "@clerk/react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { getClerkVariables } from "@/lib/brand-colors";
import { setTokenGetter } from "@/lib/tokenStore";

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

export const clerkAppearance = {
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: typeof window !== "undefined"
      ? `${window.location.origin}${basePath}/logo.svg`
      : "/logo.svg",
  },
  get variables() {
    return {
      ...getClerkVariables(),
      borderRadius: "0px",
      fontFamily: "Montserrat, sans-serif",
      fontFamilyButtons: "Montserrat, sans-serif",
      fontSize: "14px",
    };
  },
  elements: {
    rootBox: "w-full",
    cardBox: "border border-neutral-200 shadow-sm w-full overflow-hidden",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none p-8",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none px-8 pb-6",
    headerTitle: "font-bold text-2xl",
    headerSubtitle: "text-sm",
    socialButtonsBlockButtonText: "font-medium",
    formFieldLabel: "font-medium text-sm uppercase tracking-wider",
    footerActionLink: "font-bold uppercase tracking-wider",
    footerActionText: "text-sm",
    dividerText: "text-xs uppercase tracking-widest",
    identityPreviewEditButton: "",
    formFieldSuccessText: "",
    alertText: "",
    logoBox: "justify-center mb-4",
    logoImage: "h-12",
    socialButtonsBlockButton: "border border-neutral-300 hover:bg-neutral-50",
    formButtonPrimary: "bg-primary hover:bg-primary/90 uppercase tracking-wider text-xs py-3",
    formFieldInput: "border-neutral-300 focus:border-primary",
    footerAction: "",
    dividerLine: "bg-neutral-200",
    alert: "border-neutral-300",
    otpCodeFieldInput: "",
    formFieldRow: "",
    main: "",
  },
};

const localization = {
  signIn: {
    start: { title: "Mariage Afro", subtitle: "Connectez-vous à votre espace" },
  },
  signUp: {
    start: { title: "Créer votre compte", subtitle: "Rejoignez Mariage Afro" },
  },
};

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClient = useQueryClient();
  const prev = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    const off = addListener(({ user }) => {
      const id = user?.id ?? null;
      if (prev.current !== undefined && prev.current !== id) {
        queryClient.clear();
      }
      prev.current = id;
    });
    return off;
  }, [addListener, queryClient]);
  return null;
}

/**
 * Registers the Clerk getToken function into the module-level token store
 * so non-React modules (clientApi, vendorApi) can attach the Bearer token
 * to every authenticated API request.
 */
function ClerkTokenSync() {
  const { getToken } = useAuth();
  useEffect(() => {
    setTokenGetter(getToken);
    return () => setTokenGetter(() => Promise.resolve(null));
  }, [getToken]);
  return null;
}

export function MariageAfroClerkProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  useLocation();

  if (!clerkPubKey) {
    return <>{children}</>;
  }

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      localization={localization}
      routerPush={(to) => navigate(stripBase(to))}
      routerReplace={(to) => navigate(stripBase(to), { replace: true })}
    >
      <ClerkQueryClientCacheInvalidator />
      <ClerkTokenSync />
      {children}
    </ClerkProvider>
  );
}

export { basePath };
