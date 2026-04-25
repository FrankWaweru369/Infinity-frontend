export default function Avatar({ src, username, size = 40 }) {
  const firstLetter = username?.charAt(0)?.toUpperCase() || "?";

  if (src) {
    return (
      <img
        src={src}
        alt={username}
        style={{ width: size, height: size }}
        className="rounded-full object-cover flex-shrink-0"
      />
    );
  }

  return (
    <div
      style={{ width: size, height: size }}
      className="rounded-full flex items-center justify-center
                 bg-black text-white font-semibold flex-shrink-0"
    >
      {firstLetter}
    </div>
  );
}
