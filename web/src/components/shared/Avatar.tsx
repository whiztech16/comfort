export default function Avatar({ name }: { name: string | null }) {
  const initial = (name?.trim()[0] ?? "A").toUpperCase();

  return (
    <span
      aria-hidden
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#899bc7] text-[0.95rem] font-semibold text-white"
    >
      {initial}
    </span>
  );
}