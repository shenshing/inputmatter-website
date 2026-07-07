import logoImage from "../../assets/logo.svg";

export default function Logo({ size = 30 }: { size?: number }) {
  return <img src={logoImage} alt="" width={size} height={size} className="shrink-0" />;
}
