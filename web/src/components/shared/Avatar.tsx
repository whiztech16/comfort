type AvatarProps = Readonly<{
  name: string | null;
  size?: "sm" | "md";
}>;

const sizes = {
  sm: "h-8 w-8 text-[0.8125rem]",
  md: "h-10 w-10 text-[0.95rem]",
};

export default function Avatar({ name, size = "md" }: AvatarProps) {
  const initial = (name?.trim()[0] ?? "A").toUpperCase();

  return (
    <span
      aria-hidden
      className={`flex shrink-0 items-center justify-center rounded-full bg-[#899bc7] font-semibold text-white ${sizes[size]}`}
    >
      {initial}
    </span>
  );
}