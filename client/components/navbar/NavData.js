import {
  Laptop,
  Cpu,
  Camera,
  Smartphone,
  Home,
  Tv,
  Headphones,
  Watch,
  Fan,
  Gamepad2,
  LayoutGrid,
} from "lucide-react";

export const CATEGORIES = [
  "All Categories",
  "Electronics",
  "Laptops",
  "Cameras",
  "Smartphones",
];

export const NAV_LINKS = [
  { name: "Home", path: "/" },
  { name: "Products", path: "/products" },
  { name: "About Us", path: "/about" },
  { name: "Contact Us", path: "/contact" },
];

export const SIDEBAR_DATA = {
  "Laptop & Computer": {
    icon: Laptop,
    brands: ["Apple", "Dell", "HP", "Lenovo", "Asus", "Acer", "MSI", "Razer"],
    departments: [
      "Gaming Laptops",
      "Ultrabooks",
      "MacBooks",
      "Workstations",
      "Business Laptops",
    ],
  },
  "Computer Hardware": {
    icon: Cpu,
    brands: ["Intel", "AMD", "NVIDIA", "Corsair"],
    departments: ["CPUs", "GPUs", "Motherboards", "RAM"],
  },
  "Camera & Photo": {
    icon: Camera,
    brands: ["Canon", "Sony", "Nikon"],
    departments: ["DSLR", "Mirrorless", "Lenses"],
  },
  "Smartphone & Tablet": {
    icon: Smartphone,
    brands: ["Apple", "Samsung", "Google"],
    departments: ["5G Phones", "Tablets"],
  },
  "Home & Electronic": {
    icon: Home,
    brands: ["Dyson", "Philips"],
    departments: ["Smart Home", "Lighting"],
  },
  "TV & Audio": {
    icon: Tv,
    brands: ["Sony", "LG", "Samsung"],
    departments: ["OLED TVs", "Soundbars"],
  },
  "Headphone & Speaker": {
    icon: Headphones,
    brands: ["Bose", "JBL", "Sony"],
    departments: ["Wireless", "Noise Cancelling"],
  },
  "Watches & Eyewear": {
    icon: Watch,
    brands: ["Apple", "Garmin"],
    departments: ["Smartwatches", "Fitness"],
  },
  "Heatsink & Fan": {
    icon: Fan,
    brands: ["Noctua", "NZXT"],
    departments: ["AIO Coolers", "Case Fans"],
  },
  "Gamepad & Console": {
    icon: Gamepad2,
    brands: ["Sony", "Microsoft", "Nintendo"],
    departments: ["Consoles", "Controllers"],
  },
  "Digital & Electronic": {
    icon: LayoutGrid,
    brands: ["Gadgets"],
    departments: ["Accessories"],
  },
};
