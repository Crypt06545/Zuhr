"use client";

import { useState, useRef, useCallback } from "react";
import { ArrowRight, ChevronDown } from "lucide-react";
import { SIDEBAR_DATA } from "./NavData";

const HIDE_DELAY = 150;
const DEFAULT_CAT = "Laptop & Computer";

const MegaMenuSidebar = () => {
  const [activeCat, setActiveCat] = useState(DEFAULT_CAT);
  const [flyoutOpen, setFlyoutOpen] = useState(false);
  const hideTimer = useRef(null);
  const isOverSidebar = useRef(false);
  const isOverFlyout = useRef(false);

  const clearHide = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
  };

  const scheduleHide = useCallback(() => {
    clearHide();
    hideTimer.current = setTimeout(() => {
      if (!isOverSidebar.current && !isOverFlyout.current) {
        setFlyoutOpen(false);
      }
    }, HIDE_DELAY);
  }, []);

  const onSidebarEnter = useCallback(() => {
    isOverSidebar.current = true;
    clearHide();
    setFlyoutOpen(true);
  }, []);

  const onSidebarLeave = useCallback(() => {
    isOverSidebar.current = false;
    scheduleHide();
  }, [scheduleHide]);

  const onFlyoutEnter = useCallback(() => {
    isOverFlyout.current = true;
    clearHide();
  }, []);

  const onFlyoutLeave = useCallback(() => {
    isOverFlyout.current = false;
    scheduleHide();
  }, [scheduleHide]);

  const handleCatEnter = useCallback((item) => {
    setActiveCat(item);
  }, []);

  return (
    <div className="hidden lg:block w-72 flex-shrink-0 self-stretch relative z-30">
      <div
        onMouseEnter={onSidebarEnter}
        onMouseLeave={onSidebarLeave}
        className="w-full h-full bg-white border border-gray-100 shadow-sm rounded-2xl p-4 flex flex-col"
      >
        <div className="space-y-1">
          {Object.entries(SIDEBAR_DATA).map(([item, data]) => {
            const Icon = data.icon;
            const isActive = activeCat === item;
            return (
              <div
                key={item}
                onMouseEnter={() => handleCatEnter(item)}
                className={`flex items-center justify-between px-3 py-2 text-[13px] font-semibold rounded-xl cursor-pointer transition-all duration-200 ${
                  isActive
                    ? "bg-orange-50 text-orange-600"
                    : "text-gray-600 hover:bg-gray-50 hover:text-orange-600"
                }`}
              >
                <span className="flex items-center gap-3">
                  <Icon
                    size={18}
                    strokeWidth={isActive ? 2.5 : 1.75}
                    className={isActive ? "text-orange-600" : "text-gray-400"}
                  />
                  {item}
                </span>
                <ArrowRight
                  size={14}
                  className={`transition-all duration-300 ${
                    isActive
                      ? "opacity-100 translate-x-0"
                      : "opacity-0 -translate-x-2"
                  }`}
                />
              </div>
            );
          })}
        </div>
      </div>

      {flyoutOpen && (
        <div
          onMouseEnter={onFlyoutEnter}
          onMouseLeave={onFlyoutLeave}
          className="absolute top-0 left-full w-3 h-full"
        />
      )}

      <div
        onMouseEnter={onFlyoutEnter}
        onMouseLeave={onFlyoutLeave}
        className={`absolute top-0 left-full ml-3 w-[460px] bg-white border border-gray-100 shadow-2xl rounded-2xl p-6 grid grid-cols-2 gap-6 transition-all duration-200 ease-out ${
          flyoutOpen
            ? "opacity-100 visible translate-x-0 pointer-events-auto"
            : "opacity-0 invisible translate-x-2 pointer-events-none"
        }`}
      >
        <div>
          <h4 className="text-[11px] uppercase tracking-wider text-gray-400 font-bold mb-4">
            Brands
          </h4>
          <ul className="space-y-3">
            {SIDEBAR_DATA[activeCat]?.brands.map((brand) => (
              <li
                key={brand}
                className="text-[14px] text-gray-600 hover:text-orange-600 transition-colors cursor-pointer font-medium flex items-center justify-between group/item"
              >
                <span>{brand}</span>
                <ChevronDown
                  size={12}
                  className="text-gray-300 -rotate-90 group-hover/item:text-orange-500"
                />
              </li>
            ))}
          </ul>
        </div>
        <div className="border-l border-gray-100 pl-6">
          <h4 className="text-[11px] uppercase tracking-wider text-gray-400 font-bold mb-4">
            Departments
          </h4>
          <ul className="space-y-3">
            {SIDEBAR_DATA[activeCat]?.departments.map((dept) => (
              <li
                key={dept}
                className="text-[14px] text-gray-600 hover:text-orange-600 transition-colors cursor-pointer font-medium flex items-center justify-between group/item"
              >
                {dept}
                <ChevronDown
                  size={12}
                  className="text-gray-300 -rotate-90 group-hover/item:text-orange-500"
                />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default MegaMenuSidebar;
