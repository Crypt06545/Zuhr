import NavBrand from "./NavBrand";
import NavLinks from "./NavLinks";
import SearchBar from "./SearchBar";
import NavActions from "./NavActions";

const Navbar = () => {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-100">
      <div className="container mx-auto px-4 flex items-center justify-between gap-4">
        <NavBrand />
        <SearchBar />
        <NavActions />
      </div>
      <div className="hidden lg:block border-t border-gray-100">
        <div className="container mx-auto px-4">
          <NavLinks />
        </div>
      </div>
    </header>
  );
};

export default Navbar;
