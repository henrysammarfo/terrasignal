import tsLogo from "@/assets/terrasignal-logo.png";

interface Props {
  size?: "sm" | "md";
}

const Logo = ({ size = "md" }: Props) => {
  const imgSize = size === "sm" ? "w-6 h-6" : "w-7 h-7";

  return (
    <div className="flex items-center gap-2">
      <img src={tsLogo} alt="TerraSignal" className={`${imgSize} object-contain`} />
      <span className={`font-semibold font-['Geist'] tracking-[-0.02em] text-foreground ${size === "sm" ? "text-[15px]" : "text-[17px]"}`}>
        TerraSignal
      </span>
    </div>
  );
};

export default Logo;
