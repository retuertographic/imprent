import { HomeMotion } from "@/components/sites/seritene/HomeMotion";
import { HomeProjects } from "@/components/sites/seritene/HomeProjects";
import {
  AudiencesSection,
  BrandSection,
  ConfidenceSection,
  FinalSection,
  HelpSection,
  ServicesSection,
  SocialSection,
} from "@/components/sites/seritene/HomeSections";
import { HomeTeam } from "@/components/sites/seritene/HomeTeam";
import { SiteFooter } from "@/components/sites/seritene/SiteFooter";
import { SiteHeader } from "@/components/sites/seritene/SiteHeader";
import { UnboxHero } from "@/components/sites/seritene/UnboxHero";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main id="contenido" className="brand-main bold-home">
        <UnboxHero />
        <HomeMotion>
          <ServicesSection />
          <BrandSection />
          <HomeProjects />
          <ConfidenceSection />
          <AudiencesSection />
          <SocialSection />
          <HomeTeam />
          <HelpSection />
          <FinalSection />
        </HomeMotion>
      </main>
      <SiteFooter />
    </>
  );
}
