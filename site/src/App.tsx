import { Actions } from "./components/Actions";
import { Footer } from "./components/Footer";
import { Hero } from "./components/Hero";
import { HowItWorks } from "./components/HowItWorks";
import { Nav } from "./components/Nav";
import { UseIt } from "./components/UseIt";
import { Watch } from "./components/Watch";

export function App() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Actions />
        <Watch />
        <UseIt />
        <HowItWorks />
      </main>
      <Footer />
    </>
  );
}
