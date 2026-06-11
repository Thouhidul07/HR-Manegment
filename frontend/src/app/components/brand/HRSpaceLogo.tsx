import type { ImgHTMLAttributes } from "react";

type HRSpaceLogoProps = ImgHTMLAttributes<HTMLImageElement>;

export function HRSpaceLogo({ className = "", alt = "HRSpace", ...props }: HRSpaceLogoProps) {
  return <img src="/hrspace-logo.svg" alt={alt} className={className} {...props} />;
}
