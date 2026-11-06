type ProfileAvatarProps = Readonly<{
  name: string;
  photoUrl: string | null;
  size?: "md" | "lg";
}>;

const sizes = {
  md: "h-16 w-16 text-2xl",
  lg: "h-24 w-24 text-4xl",
};

// The profile photo, or the first initial when there is no photo
export default function ProfileAvatar({
  name,
  photoUrl,
  size = "lg",
}: ProfileAvatarProps) {
  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt=""
        className={`shrink-0 rounded-full object-cover ring-4 ring-white ${sizes[size]}`}
      />
    );
  }

  return (
    <span
      aria-hidden
      className={`flex shrink-0 items-center justify-center rounded-full bg-[#899bc7] font-semibold text-white ring-4 ring-white ${sizes[size]}`}
    >
      {(name.trim()[0] ?? "?").toUpperCase()}
    </span>
  );
}