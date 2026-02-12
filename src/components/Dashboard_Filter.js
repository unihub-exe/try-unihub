import Slider from "rc-slider";
import "rc-slider/assets/index.css";
import React from "react";

function Dashboard_Filter({
  filterOptions = {
    category: "",
    dateRange: "",
    price: [0, 20000000],
  },
  setFilterOptions,
  handleFilterClear,
}) {
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    switch (name) {
      case "category":
        setFilterOptions({ ...filterOptions, category: value });
        break;
      case "dateRange":
        setFilterOptions({ ...filterOptions, dateRange: value });
        break;
      case "isPremium":
        setFilterOptions({ ...filterOptions, isPremium: checked });
        break;
      default:
        break;
    }
  };

  // function to handle price change in filters
  const handlePriceChange = (value) => {
    setFilterOptions({ ...filterOptions, price: [...value] });
  };

  const inputClassName =
    "w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 focus:border-[color:var(--secondary-color)] focus:ring-2 focus:ring-[color:var(--secondary-color)]/10 outline-none transition-all text-sm font-medium text-gray-700";

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-black text-gray-900 tracking-tight">
          Filters
        </h3>
        <button
          onClick={handleFilterClear}
          className="text-[10px] font-bold text-[color:var(--secondary-color)] uppercase tracking-wide hover:underline"
        >
          Reset
        </button>
      </div>

      <form className="flex flex-col gap-y-4">
        {/* Selection menu to choose a category */}
        <div>
          <label
            htmlFor="category"
            className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block"
          >
            Category
          </label>
          <select
            id="category"
            name="category"
            value={filterOptions.category}
            onChange={handleInputChange}
            className={inputClassName}
          >
            <option value="">All Categories</option>
            {[
              "Tech",
              "Music",
              "Sports",
              "Workshops",
              "Meetups",
              "Festivals",
              "Conferences",
              "Competitions",
              "Hackathon",
              "Webinar",
              "Party",
              "Seminar",
              "Startup",
              "Art",
              "Gaming",
            ].map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Date Range */}
        <div>
          <label
            htmlFor="dateRange"
            className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block"
          >
            Date
          </label>
          <select
            id="dateRange"
            name="dateRange"
            value={filterOptions.dateRange}
            onChange={handleInputChange}
            className={inputClassName}
          >
            <option value="">Any Date</option>
            <option value="today">Today</option>
            <option value="tomorrow">Tomorrow</option>
            <option value="this_week">This Week</option>
            <option value="this_month">This Month</option>
          </select>
        </div>

        {/* Price Range */}
        <div className="px-1 pt-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 block flex justify-between">
            <span>Price Range</span>
            <span className="text-[color:var(--secondary-color)]">
              {filterOptions.price[1] >= 20000000
                ? "All Prices"
                : `Up to ₦${filterOptions.price[1].toLocaleString()}`}
            </span>
          </label>
          <div className="px-2">
            <Slider
              range
              min={0}
              max={20000000}
              step={10000}
              value={filterOptions.price}
              onChange={handlePriceChange}
              trackStyle={[
                { backgroundColor: "var(--secondary-color)", height: 4 },
              ]}
              handleStyle={[
                {
                  borderColor: "var(--secondary-color)",
                  height: 16,
                  width: 16,
                  marginTop: -6,
                  backgroundColor: "white",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                },
                {
                  borderColor: "var(--secondary-color)",
                  height: 16,
                  width: 16,
                  marginTop: -6,
                  backgroundColor: "white",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                },
              ]}
              railStyle={{ backgroundColor: "#E5E7EB", height: 4 }}
            />
          </div>
        </div>

        {/* Premium Toggle */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
          <label
            htmlFor="isPremium"
            className="text-xs font-bold text-gray-700 flex items-center gap-2 cursor-pointer"
          >
             Premium Only
          </label>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              id="isPremium"
              name="isPremium"
              checked={filterOptions.isPremium}
              onChange={handleInputChange}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[color:var(--secondary-color)]"></div>
          </label>
        </div>
      </form>
    </div>
  );
}

export default Dashboard_Filter;
