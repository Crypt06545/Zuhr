import React from "react";

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex min-h-svh">
      {/* Left */}
      <div className="hidden lg:flex flex-1 flex-col justify-between bg-gradient-to-br from-[#06251A] to-[#105458] lg:flex">
        <div className="p-8 text-white">This is left side</div>
      </div>

      {/* Right */}
      <div className="flex flex-1 items-center justify-center bg-background p-8">
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;
