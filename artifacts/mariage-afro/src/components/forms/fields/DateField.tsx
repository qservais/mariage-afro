import { forwardRef } from "react";
import { TextField, type TextFieldProps } from "./TextField";

export type DateFieldProps = Omit<TextFieldProps, "type">;

/**
 * DateField — TextField préconfiguré type="date".
 * Le sélecteur natif est utilisé sur tous les devices pour garantir l'UX mobile.
 */
export const DateField = forwardRef<HTMLInputElement, DateFieldProps>(function DateField(
  props,
  ref,
) {
  return <TextField ref={ref} type="date" {...props} />;
});
