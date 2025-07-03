import React from 'react';

const AboutSydney = () => {
  return (
    <>
      <section id="meet-sydney" className="bg-gray-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center text-gray-900 glow-text">
            Meet Sydney
          </h2>
          <p className="mt-4 text-xl text-gray-600 text-center">
            Your personal AI assistant for grading and feedback
          </p>

          <div className="sydney-card mt-12 bg-white rounded-xl shadow-lg overflow-hidden max-w-4xl mx-auto">
            <div className="feedback-section p-8 bg-white">
              <div className="feedback-content space-y-4">
                <p className="text-gray-800">
                  "Great job on your essay! Your arguments are well-structured and supported with evidence. Consider expanding on your conclusion for a stronger impact."
                </p>
                <p className="text-gray-800">
                  "Keep up the excellent work in organizing your thoughts clearly."
                </p>
              </div>
              <div className="grade-display mt-6 text-2xl font-bold text-green-600">
                Grade: A
              </div>
            </div>

            <div className="divider h-px bg-gray-200" />

            <div className="animation-section p-8 bg-gray-50">
              <div className="animation-container space-y-4">
                {[...Array(5)].map((_, index) => (
                  <div key={index} className="line h-4 bg-gray-200 rounded relative overflow-hidden">
                    <div className="highlight absolute h-full w-full bg-blue-200 opacity-50" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="text-center mt-8">
            <a href="#pricing" className="inline-block px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-200">
              Meet Sydney Today
            </a>
          </div>
        </div>
      </section>

      {/* FERPA Compliant Section */}
      <section id="ferpa" className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="md:flex md:items-center md:space-x-10">
            <div className="md:w-1/2">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">FERPA Compliant</h2>
              <p className="text-lg text-gray-600">
                Woof Tech does not own any input or output. Anything that you add is owned by you. Sydney does not share any crucial information<sup>*</sup>.
              </p>
              <p className="mt-4 text-sm text-gray-500">
                *Woof Tech will share information with a credible source if and when data is requested.
              </p>
            </div>
            <div className="md:w-1/2 flex justify-center mt-8 md:mt-0">
              <img src="/api/placeholder/400/300" alt="FERPA Compliance" className="w-3/4 rounded-lg shadow-lg" />
            </div>
          </div>
        </div>
      </section>

      {/* Ensuring Safe Use Section */}
      <section id="security" className="bg-gray-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="md:flex md:items-center md:space-x-10">
            <div className="md:w-1/2 order-2 md:order-1 flex justify-center mt-8 md:mt-0">
              <img src="/api/placeholder/400/300" alt="Data Security" className="w-3/4 rounded-lg shadow-lg" />
            </div>
            <div className="md:w-1/2 order-1 md:order-2">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Ensuring Safe Use</h2>
              <p className="text-lg text-gray-600">
                Woof Tech uses AWS to fully secure and authenticate any data or user on Acadex Mini. We take your security and data seriously and will not use or sell your data without your consent.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy Assurance Section */}
      <section id="privacy" className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="md:flex md:items-center md:space-x-10">
            <div className="md:w-1/2">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Privacy Assurance</h2>
              <p className="text-lg text-gray-600">
                Your data is yours. We ensure that all your inputs and outputs remain confidential and are not shared with third parties. Trust in Acadex Mini for a secure grading experience.
              </p>
            </div>
            <div className="md:w-1/2 flex justify-center mt-8 md:mt-0">
              <img src="/api/placeholder/400/300" alt="Privacy Assurance" className="w-3/4 rounded-lg shadow-lg" />
            </div>
          </div>
        </div>
      </section>

      {/* Seamless Integration Section */}
      <section id="integration" className="bg-gray-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="md:flex md:items-center md:space-x-10">
            <div className="md:w-1/2 order-2 md:order-1 flex justify-center mt-8 md:mt-0">
              <img src="/api/placeholder/400/300" alt="Seamless Integration" className="w-3/4 rounded-lg shadow-lg" />
            </div>
            <div className="md:w-1/2 order-1 md:order-2">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Seamless Integration</h2>
              <p className="text-lg text-gray-600">
                Acadex Mini integrates effortlessly with your existing systems, providing a smooth transition and immediate benefits without disrupting your current workflow.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Culmination Section */}
      <section id="culmination" className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">The Culmination of Excellence</h2>
          <p className="mt-4 text-xl text-gray-600 text-center">
            All the powerful features of Acadex Mini come together to provide you with an unparalleled grading assistant. Experience the seamless integration of automated grading, personalized feedback, accurate assessments, and a user-friendly interface—all in one platform.
          </p>
          <div className="flex justify-center mt-12">
            <a href="#pricing" className="inline-block px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-200">
              Get Started Now
            </a>
          </div>
        </div>
      </section>
    </>
  );
};

export default AboutSydney;