import Link from "next/link";
import Image from "next/image";

type BrandLogoProps = {
  href?: string;
  compact?: boolean;
};

export function BrandLogo({ href = "/", compact = false }: BrandLogoProps) {
  const width = compact ? 220 : 340;
  const height = compact ? 54 : 84;

  const content = (
    <div className="relative leading-none">
      <Image
        src="/brand/logo-dark.png"
        alt="SCOPEX Diagnostics"
        width={width}
        height={height}
        className="logo-dark block h-auto w-auto max-w-full"
        priority
      />
      <Image
        src="/brand/logo-light.png"
        alt="SCOPEX Diagnostics"
        width={width}
        height={height}
        className="logo-light hidden h-auto w-auto max-w-full"
        priority
      />
    </div>
  );

  if (!href) return content;
  return <Link href={href}>{content}</Link>;
}
