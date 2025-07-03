import React from "react";

const Pricing = () => (
  <section id="pricing" className="bg-gray-100 py-20">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h2 className="text-3xl font-bold text-center text-gray-900">
        Pricing Plans
      </h2>
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Example Plan */}
        <div className="border border-gray-200 rounded-lg shadow-sm bg-white flex flex-col">
          <div className="p-6">
            <h3 className="text-xl font-semibold text-gray-900">Free</h3>
            <p className="mt-4 text-gray-600">$0/month</p>
          </div>
          <div className="p-6">
            <a
              href="#"
              className="block w-full text-center px-4 py-2 bg-blue-600 text-white rounded"
            >
              Sign Up
            </a>
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default Pricing;
