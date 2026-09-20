import MobileBottomNav from "@/components/navbar/MobileBottomNav";
import Navbar from "@/components/navbar/Navbar";
import React from "react";

const PublicLayout = ({ children }) => {
  return (
    <>
      <Navbar />
      <main className="container mx-auto px-4 lg:px-6">{children}</main>
      <MobileBottomNav />
    </>
  );
};

export default PublicLayout;
