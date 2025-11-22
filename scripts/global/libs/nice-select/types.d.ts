export type NiceSelectOption = {
  text: string;
  value: string;
  extra: string;
  selected?: boolean;
  disabled?: boolean;
  element?: HTMLLIElement; // Set internally during options parsing
};

export type NiceSelectConfig = {
  options: NiceSelectOption[];
  placeholder: string;     // The select placeholder text
  searchText?: string;     // The placeholder and ARIA label of the options search input
  selectedText?: string;   // The selected text when multiple options are selected (after the number e.g. "3 selected")
  cancelText?: string;     // The cancel button ARIA label
  searchable?: boolean;
  showSelectedItems?: boolean;
  multiple?: boolean;
  required?: boolean;      // Initial required state. Defaults to false.
  disabled?: boolean;      // Initial disabled state. Defaults to false.
  readonly?: boolean;      // Initial readonly state. Defaults to false.
  name: string;            // The select input name
  label: string;           // The label text
  form?: string;           // The ID of the owner form (needed if the select is not inside its DOM)
  className?: string;      // The root element classes
  labelClassName?: string; // The label element classes
};
