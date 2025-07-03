import React from 'react';

const Features = () => {
  return (
    <section id="features" className="section py-16 bg-white">
      <div className="section-content max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Feedback That Is Uniquely Yours */}
        <div className="md:flex md:items-center md:space-x-10">
          <div className="md:w-1/2">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Feedback That Is Uniquely Yours
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              Provide personalized feedback that reflects your teaching style. Our AI adapts to deliver comments as if they came directly from you. Enhance student engagement by ensuring feedback is consistent and meaningful.
            </p>
            <div className="mt-6">
              <a 
                href="#pricing" 
                className="inline-block px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                Customize Your Feedback
              </a>
            </div>
          </div>
          <div className="md:w-1/2 flex justify-center mt-8 md:mt-0">
            <img
              src="/api/placeholder/400/300"
              alt="Customizable Feedback"
              className="w-3/4 rounded-lg shadow-lg"
             
            />
          </div>
        </div>

        {/* Accurate Assessments */}
        <div className="md:flex md:items-center md:space-x-10 mt-20">
          <div className="md:w-1/2 order-2 md:order-1 flex justify-center mt-8 md:mt-0">
            <img
              src="/api/placeholder/400/300"
              alt="Accurate Assessments"
              className="w-3/4 rounded-lg shadow-lg"
              data-aos="fade-right"
            />
          </div>
          <div className="md:w-1/2 order-1 md:order-2">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Accurate Assessments
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              Trust in our AI to provide precise grading, ensuring fairness and consistency across all student submissions. Acadex Mini analyzes each paper thoroughly, so you can focus on what matters most—teaching.
            </p>
            <div className="mt-6">
              <a 
                href="#pricing" 
                className="inline-block px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                Improve Accuracy
              </a>
            </div>
          </div>
        </div>

        {/* Powerful Yet Simple */}
        <div className="md:flex md:items-center md:space-x-10 mt-20">
          <div className="md:w-1/2">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Powerful Yet Simple
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              Experience a beautifully crafted interface designed to make your workflow smoother, not harder. Spend less time navigating and more time inspiring your students. Acadex Mini is intuitive and easy to use, even for the least tech-savvy.
            </p>
            <div className="mt-6">
              <a 
                href="#pricing" 
                className="inline-block px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                Enhance Your Workflow
              </a>
            </div>
          </div>
          <div className="md:w-1/2 flex justify-center mt-8 md:mt-0">
            <img
              src="/api/placeholder/400/300"
              alt="User-Friendly Interface"
              className="w-3/4 rounded-lg shadow-lg"
             
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;