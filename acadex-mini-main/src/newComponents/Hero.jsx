import React from "react";

const Hero = () => (
  <section
    id="hero"
    className="flex flex-col items-center justify-center h-screen bg-gradient-to-r from-pink-500 to-yellow-500 animate-gradient"
  >
    <h1 className="text-white text-6xl font-bold text-center">
      Welcome to Acadex Mini
    </h1>
    <h2 className="text-white text-2xl mt-4 opacity-0 animation-fade-in">
      Your ultimate solution to grading papers
    </h2>
  </section>
);

export default Hero;
