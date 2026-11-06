type Option<T extends string> = { value: T; label: string };

type SegmentedProps<T extends string> = Readonly<{
  legend: string;
  name: string;
  options: readonly Option<T>[];
  value: T;
  onChange: (next: T) => void;
}>;

export default function Segmented<T extends string>({
  legend,
  name,
  options,
  value,
  onChange,
}: SegmentedProps<T>) {
  return (
    <fieldset>
      <legend className="mb-2 text-[0.8125rem] font-medium text-navy">
        {legend}
      </legend>
      <div className="grid auto-cols-fr grid-flow-col gap-1 rounded-full bg-[#f1f3fa] p-1">
        {options.map((option) => (
          <label key={option.value} className="relative">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="peer sr-only"
            />
            <span className="flex h-10 cursor-pointer items-center justify-center rounded-full px-3 text-[0.8125rem] font-medium text-navy/65 transition peer-checked:bg-white peer-checked:text-navy peer-checked:shadow-sm peer-focus-visible:outline-2 peer-focus-visible:outline-brand-deep">
              {option.label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}