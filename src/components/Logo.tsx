export default function Logo({ size = 46 }: { size?: number }) {
  return <img src="/img/logo.webp" alt="Eco House — Make your house eco-friendly" className="logo" style={{ height: size }} />;
}
