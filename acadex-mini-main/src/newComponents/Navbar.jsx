import React from "react";

const Navbar = () => (
  <nav className="bg-white border-b border-gray-200 fixed w-full z-10">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between h-16">
        <div className="flex-shrink-0">
          <a href="/" className="text-xl font-semibold text-gray-900">
            Acadex Mini
          </a>
        </div>
        <div className="hidden md:flex">
          <a
            href="#features"
            className="ml-8 text-gray-700 hover:text-gray-900"
          >
            Features
          </a>
          <a href="/pricing" className="ml-8 text-gray-700 hover:text-gray-900">
            Pricing
          </a>
          <a href="/contact" className="ml-8 text-gray-700 hover:text-gray-900">
            Contact
          </a>
        </div>
        <div className="hidden md:flex">
          <a
            href="/login"
            className="ml-8 px-4 py-2 bg-blue-600 text-white rounded"
          >
            Sign In
          </a>
        </div>
      </div>
    </div>
  </nav>
);

export default Navbar;
