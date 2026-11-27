import "./styles/seritene/home.css";
import "./styles/seritene/home-projects.css";
import "./styles/seritene/home-team.css";
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
import { HomeTrust } from "@/components/sites/seritene/HomeTrust";
import { UnboxHero } from "@/components/sites/seritene/UnboxHero";

export default function Home() {
  return (
    <>
      <main id="contenido" className="brand-main bold-home">
        <UnboxHero />
        <HomeMotion>
          <HomeTrust />
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
    </>
  );
}
