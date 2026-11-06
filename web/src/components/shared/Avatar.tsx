type Size = "sm" | "md" | "lg";

const sizeClass: Record<Size, string> = {
  sm: "h-8 w-8 text-[0.8rem]",
  md: "h-10 w-10 text-[0.95rem]",
  lg: "h-20 w-20 text-[1.75rem]",
};

export default function Avatar({
  name,
  size = "md",
}: {
  name: string | null;
  size?: Size;
}) {
  const initial = (name?.trim()[0] ?? "A").toUpperCase();

  return (
    <span
      aria-hidden
      className={`flex shrink-0 items-center justify-center rounded-full bg-[#243447] font-semibold text-white ${sizeClass[size]}`}
    >
      {initial}
    </span>
  );
}
