# Forms kit — `components/forms/`

Briques partagées pour tous les formulaires Mariage Afro. Charte respectée
(Montserrat + Cormorant Garamond, bordeaux/cream/gold, `rounded-none`),
nativement responsives, WCAG AA, i18n via `react-i18next` (les composants
ne contiennent jamais de string en dur).

> **Statut.** Cette tâche pose les briques. Les formulaires existants ne
> sont **pas** modifiés ici — c'est le rôle des deux tâches de refonte sœurs.

## Inventaire (résumé)

Le kit a été scopé pour couvrir les ~30 formulaires identifiés :

| Contexte | Exemples | Couvert par |
|---|---|---|
| Public — conversion | `contact.tsx`, `LeadModal`, `MultiDevisForm` | `FormShell` + `FormStepper` (devis multi-étapes) + `SelectableCard` (services) |
| Public — outils | `outils-budget`, `outils-quiz` | `NumberStepperField`, `SelectableCard` |
| Onboarding | `OnboardingGate`, `VendorOnboardingGate` | `FormStepper` + champs harmonisés |
| Espace Client (CRUD) | `client/profil`, `client/budget`, `client/invites`, etc. | `FormShell` (variant page) + `FormFieldGroup` |
| Espace Pro (CRUD) | `vendor/profile`, `vendor/services`, `vendor/availability` | `FormShell` + champs harmonisés |
| Modales | `LeadModal`, `MultiDevisForm`, dialogs | `MobileFormSheet` |
| Auth | `sign-in`, `sign-up`, `vendor/sign-in` | composants Clerk (hors scope) |

## Composants

### `<FormShell>`

```tsx
<FormShell
  variant="page"            // "page" | "modal"
  eyebrow="Devenir prestataire"
  title="Inscription pro"
  description="3 étapes, 2 minutes."
  stickyFooter
  footer={<FormSubmitButton>Envoyer</FormSubmitButton>}
>
  {/* fields */}
</FormShell>
```

### `<FormFieldGroup>`

Bloc « titre + description + grille » (1, 2 ou 3 colonnes).

```tsx
<FormFieldGroup title="Coordonnées" columns={2}>
  <TextField name="firstName" label={t("first_name")} required />
  <TextField name="lastName" label={t("last_name")} required />
</FormFieldGroup>
```

### `<FormStepper>` + `StepDefinition`

Multi-étapes, validation Zod par étape, persistance sessionStorage.

```tsx
import { FormStepper, type StepDefinition } from "@/components/forms";
import { z } from "zod";

interface Values extends Record<string, unknown> {
  name: string;
  email: string;
}

const steps: StepDefinition<Values>[] = [
  {
    id: "contact",
    title: t("step1_title"),
    schema: z.object({
      name: z.string().min(2, t("errors.name_required")),
      email: z.string().email(t("errors.email_invalid")),
    }),
    content: ({ values, setValue, errors }) => (
      <>
        <TextField name="name" label={t("name")} value={values.name}
          onChange={(e) => setValue("name", e.target.value)}
          error={errors.name} required />
        <TextField name="email" label={t("email")} value={values.email}
          onChange={(e) => setValue("email", e.target.value)}
          error={errors.email} required />
      </>
    ),
  },
];

<FormStepper
  formId="devis-multi"
  steps={steps}
  initialValues={{ name: "", email: "" }}
  onSubmit={async (v) => { await submit(v); }}
  labels={t("kit.stepper", { returnObjects: true }) as StepperLocale}
/>
```

Persistance : la clé `ma-forms-kit:stepper:<formId>` est posée dans
`sessionStorage`, nettoyée automatiquement après `onSubmit` réussi.

### `<SelectableCardGroup>` + `<SelectableCard>`

Single (radiogroup) ou multi (group of checkboxes) ; clavier 100%
fonctionnel via les `<input type="radio|checkbox">` cachés.

```tsx
<SelectableCardGroup
  name="weddingType"
  value={type}
  onChange={(v) => setType(v as string)}
  label={t("wedding_type")}
  required
  columns={3}
  options={[
    { value: "intimate", label: t("intimate"), icon: <Heart /> },
    { value: "classic", label: t("classic"), icon: <Users /> },
    { value: "grand", label: t("grand"), icon: <Sparkles /> },
  ]}
/>
```

Composition manuelle (pour cas avancés) :

```tsx
<SelectableCardGroup name="services" multiple value={services} onChange={setServices}>
  <SelectableCard value="photo" label="Photo" badge="Pop." />
  <SelectableCard value="dj" label="DJ" />
</SelectableCardGroup>
```

### `<MobileFormSheet>`

Dialog Radix qui devient bottom-sheet plein écran sur mobile et modale
centrée sur desktop. Header sticky, footer (CTA) collant.

```tsx
<MobileFormSheet
  open={open}
  onOpenChange={setOpen}
  title={t("contact_title")}
  closeLabel={t("kit.actions.close")}
  footer={<FormSubmitButton form="contact-form">{t("submit")}</FormSubmitButton>}
>
  <form id="contact-form" onSubmit={onSubmit}>
    {/* fields */}
  </form>
</MobileFormSheet>
```

### Champs harmonisés (`fields/`)

Tous les champs partagent : label uppercase tracking, hint, message d'erreur
inline avec `role="alert"`, focus ring gold, taille touch ≥44px, état
disabled cohérent, charte stricte.

| Composant | Note |
|---|---|
| `<TextField>` | Wrapper `<input>` typé (text/email/url…) |
| `<TextareaField>` | min-height 120px, `resize-none` |
| `<SelectField>` | `<select>` natif (UX mobile OS) |
| `<DateField>` | `<TextField type="date">` |
| `<PhoneField>` | `inputMode="tel"`, placeholder BE |
| `<NumberStepperField>` | – / + accessibles ≥44px |

### `<FormSubmitButton>`

Bouton primaire avec spinner, focus ring gold, taille `h-12` (≥44px).

```tsx
<FormSubmitButton loading={mutation.isPending} loadingLabel={t("sending")}>
  {t("send")}
</FormSubmitButton>
```

## Hook `usePersistedFormState`

Utilisé en interne par `<FormStepper>`, mais aussi exposé pour persister un
état arbitraire dans `sessionStorage` :

```ts
const { values, setValue, clear } = usePersistedFormState({
  formId: "wizard-onboarding",
  initial: { step: 0, name: "" },
});
```

## i18n

Les composants ne contiennent **aucune** string en dur. Toutes les chaînes
internes (Précédent / Suivant / Étape X sur Y / Fermer / Diminuer /
Augmenter) sont passées en props (`labels`, `closeLabel`, `decrementLabel`,
`incrementLabel`). Les clés de référence vivent dans
`locales/{fr,nl,en}/forms.json` sous `kit.stepper.*` et `kit.actions.*`.

## Accessibilité

- Tous les inputs portent un `<label>` associé, `aria-invalid`,
  `aria-describedby` quand pertinent.
- Erreurs annoncées via `role="alert"`.
- Focus ring `focus-visible:ring-gold` (≥3:1 sur cream).
- `<FormStepper>` expose `role="progressbar"`, `aria-valuenow/min/max`,
  liste des étapes en `<ol>` avec `aria-current="step"` sur l'étape active.
- `<SelectableCardGroup>` rend un `role="radiogroup"` ou `role="group"`,
  navigation Tab/Shift+Tab + Espace pour cocher (input natif sous-jacent).
- `<MobileFormSheet>` utilise Radix Dialog (focus trap, Escape, scroll
  lock).

## Démo interne

Une page `/_dev/forms-kit` montre toutes les briques en action.
Elle n'est montée dans le router qu'en `import.meta.env.DEV` — non
indexée et inaccessible en production.

## Tests

Smoke test Playwright (core runner, sans `@playwright/test` ajouté en
dépendance — même pattern que `scripts/audit-contrast-playwright.mjs`) :
`scripts/test-forms-kit.mjs`. Couvre :
- validation du stepper (Next bloqué si schema invalide),
- persistance sessionStorage après reload (valeurs + sélection card),
- soumission finale,
- ouverture / fermeture (Escape) du `MobileFormSheet`,
- clamp / increment du `NumberStepperField`,
- activation au click de `SelectableCard` (data-selected=true).

```bash
pnpm --filter @workspace/mariage-afro run test:forms-kit
# Override base URL if needed:
FORMS_KIT_BASE_URL="http://localhost:80" pnpm --filter @workspace/mariage-afro run test:forms-kit
```
