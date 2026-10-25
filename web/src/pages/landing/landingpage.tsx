import Navbar from "../../components/landing/navabar";
import Hero from "../../components/landing/hero";
import HowComfortWorks from "../../components/landing/HowComfortWorks";
import FinalCTA from "../../components/landing/FinalCta";
import Footer from "../../components/landing/footer";

export default function LandingPage() {
  return (
    <>
      <main>
        <Navbar />
        <Hero />
        <HowComfortWorks />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}