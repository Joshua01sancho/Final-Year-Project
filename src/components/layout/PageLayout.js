import React from 'react';
import Navbar from '../common/Navbar';
import Footer from '../common/Footer';

const PageLayout = ({ children, className = '', ...props }) => {
  return (
    <div className={`min-h-screen flex flex-col ${className}`} {...props}>
      <Navbar />
      <main className="flex-grow pt-20 pb-8 container-responsive">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default PageLayout; 