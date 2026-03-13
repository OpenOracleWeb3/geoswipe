interface ThinLoadingBarProps {
  isLoading: boolean;
  color?: "teal" | "amber";
}

export function ThinLoadingBar({ isLoading, color = "teal" }: ThinLoadingBarProps) {
  if (!isLoading) {
    return null;
  }

  const colorClass = color === "amber" ? "gs-thin-bar-amber" : "gs-thin-bar-teal";

  return (
    <div className="gs-thin-bar-shell">
      <div className={`gs-thin-bar-fill ${colorClass}`} />
    </div>
  );
}
