export type NiceTextConfig = {
  name: string;            // The input name
  label: string;           // The label text
  type: 'text' | 'email' | 'tel' | 'password' | 'search'; // The input type
  value?: string;          // The input initial value
  placeholder: string;     // The input placeholder text
  cancelText?: string;     // The cancel button ARIA label
  pattern?: string;        // The input validation pattern
  required?: boolean;      // Initial required state. Defaults to false.
  disabled?: boolean;      // Initial disabled state. Defaults to false.
  readonly?: boolean;      // Initial readonly state. Defaults to false.
  form?: string;           // The ID of the owner form (needed if the select is not inside its DOM)
  className?: string;      // The root element classes
  labelClassName?: string; // The label element classes
};
