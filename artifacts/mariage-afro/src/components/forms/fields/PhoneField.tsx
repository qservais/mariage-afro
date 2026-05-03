import { forwardRef } from "react";
import { TextField, type TextFieldProps } from "./TextField";

export type PhoneFieldProps = Omit<TextFieldProps, "type">;

/**
 * PhoneField — TextField préconfiguré pour numéros de téléphone (BE).
 * Pattern souple pour ne pas bloquer la saisie internationale.
 */
export const PhoneField = forwardRef<HTMLInputElement, PhoneFieldProps>(function PhoneField(
  { placeholder = "+32 4XX XX XX XX", inputMode = "tel", autoComplete = "tel", ...rest },
  ref,
) {
  return (
    <TextField
      ref={ref}
      type="tel"
      inputMode={inputMode}
      autoComplete={autoComplete}
      placeholder={placeholder}
      {...rest}
    />
  );
});
