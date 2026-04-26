export type FieldType =
  | 'string'
  | 'text'
  | 'date'
  | 'boolean'
  | 'enum'
  | 'multiselect'
  | 'integer'
  | 'signature'
  | 'array';

export interface FieldConditional {
  field: string;
  value: boolean | string | number;
}

interface BaseField {
  id: string;
  label: string;
  optional?: boolean;
  conditional?: FieldConditional;
}

export interface StringField extends BaseField {
  type: 'string' | 'text';
}

export interface DateField extends BaseField {
  type: 'date';
}

export interface BooleanField extends BaseField {
  type: 'boolean';
}

export interface EnumField extends BaseField {
  type: 'enum';
  options: string[];
}

export interface MultiSelectField extends BaseField {
  type: 'multiselect';
  options: string[];
}

export interface IntegerField extends BaseField {
  type: 'integer';
}

export interface SignatureField extends BaseField {
  type: 'signature';
}

export interface ArrayField extends BaseField {
  type: 'array';
  items: 'string' | { type: 'object'; fields: FormField[] };
}

export type FormField =
  | StringField
  | DateField
  | BooleanField
  | EnumField
  | MultiSelectField
  | IntegerField
  | SignatureField
  | ArrayField;

export interface FormSection {
  id: string;
  title: string;
  note?: string;
  fields: FormField[];
}

export interface FormDefinition {
  form_id: string;
  title: string;
  sections: FormSection[];
}

export type FormValues = Record<string, unknown>;
