import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type ClearableFieldBaseProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  placeholder?: string;
};

type ClearableInputFieldProps = ClearableFieldBaseProps & {
  kind: "input";
};

type ClearableTextareaFieldProps = ClearableFieldBaseProps & {
  kind: "textarea";
  textareaClassName?: string;
};

export type ClearableFieldProps =
  | ClearableInputFieldProps
  | ClearableTextareaFieldProps;

export function ClearableField(props: ClearableFieldProps) {
  const { id, label, value, onChange, onClear, placeholder } = props;
  const hasValue = value.length > 0;

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        {props.kind === "textarea" ? (
          <Textarea
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={`pr-10 ${props.textareaClassName ?? ""}`}
          />
        ) : (
          <Input
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            autoComplete="off"
            className="pr-10"
          />
        )}

        {hasValue ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className={
              props.kind === "textarea"
                ? "absolute right-2 top-2"
                : "absolute right-2 top-1/2 -translate-y-1/2"
            }
            onClick={onClear}
            aria-label={`Clear ${label}`}
          >
            <X />
          </Button>
        ) : null}
      </div>
    </div>
  );
}
