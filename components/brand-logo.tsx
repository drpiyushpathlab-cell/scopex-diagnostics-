import Link from "next/link";
import Image from "next/image";

type BrandLogoProps = {
  href?: string;
  compact?: boolean;
};

export function BrandLogo({ href = "/", compact = false }: BrandLogoProps) {
  const width = compact ? 150 : 320;
  const height = compact ? 34 : 78;

  const content = (
    <div className="relative leading-none">
      <Image
        src="/brand/weblogo.png"
        alt="SCOPEX Diagnostics"
        width={width}
        height={height}
        className={`block h-auto w-auto max-w-full ${compact ? "sm:w-[175px]" : ""}`}
        priority
      />
    </div>
  );

  if (!href) return content;
  return <Link href={href}>{content}</Link>;
}
