import React from "react";
import Dashboard_Filter from "./Dashboard_Filter";

function Popup_Filter({
    filterOptions,
    setFilterOptions,
    handleClose,
    handleFilterClear,
}) {
    return (
        <div className="flex flex-col h-full">
             <div className="flex-1 overflow-y-auto pr-1">
                <Dashboard_Filter 
                    filterOptions={filterOptions}
                    setFilterOptions={setFilterOptions}
                    handleFilterClear={handleFilterClear}
                />
             </div>
             <button
                onClick={handleClose}
                className="w-full mt-6 py-4 px-6 rounded-2xl bg-[color:var(--secondary-color)] text-white font-black text-lg shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all active:scale-95"
            >
                View Results
            </button>
        </div>
    );
}

export default Popup_Filter;
