import Link from "next/link";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { ext } from "./content";
import { isLocalRoute } from "./routes";

type Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string;
  children?: ReactNode;
};

/**
 * Enlace del sitio: ruta local (con basePath) si la página está clonada;
 * si no, la misma ruta en seritene.com. URLs absolutas, mailto: y tel: pasan tal cual.
 */
export function SiteLink({ href, children, ...rest }: Props) {
  if (href.startsWith("/") && isLocalRoute(href)) {
    return (
      <Link href={href} {...rest}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href.startsWith("/") ? ext(href) : href} {...rest}>
      {children}
    </a>
  );
}
