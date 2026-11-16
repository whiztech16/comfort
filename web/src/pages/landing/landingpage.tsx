import Navbar from "../../components/landing/navabar";
import Hero from "../../components/landing/hero";
import HowComfortWorks from "../../components/landing/HowComfortWorks";
import Faqs from "../../components/landing/Faqs";
import FinalCTA from "../../components/landing/FinalCta";
import Footer from "../../components/landing/footer";

export default function LandingPage() {
  return (
    <>
      <main>
        <Navbar />
        <Hero />
        <HowComfortWorks />
        <Faqs />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}