import React, { useState, useEffect } from "react";
import axios from "axios";

function CompletedEntries() {
  const [entries, setEntries] = useState([]);
  const [error, setError] = useState(null);
  const [viewType, setViewType] = useState("grid"); // grid or column
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("added"); // added, alpha, year

  useEffect(() => {
    const fetchEntries = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/entries');
        setEntries(response.data);
      } catch (err) {
        setError('Failed to fetch entries. Please make sure the server is running.');
        console.error('Error fetching entries:', err);
      }
    };
    fetchEntries();
  }, []);

  // Search filter
  const filteredEntries = entries.filter(entry =>
    entry.title.toLowerCase().includes(search.toLowerCase())
  );

  // Sorting
  const sortedEntries = [...filteredEntries].sort((a, b) => {
    if (sortBy === "alpha") {
      return a.title.localeCompare(b.title);
    } else if (sortBy === "year") {
      return (b.releaseYear || "").localeCompare(a.releaseYear || "");
    } else {
      // as added (date)
      return new Date(b.date) - new Date(a.date);
    }
  });

  if (error) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Completed Entries</h1>
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Completed Entries</h1>
      {/* Controls */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
        <input
          type="text"
          placeholder="Search by title..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="p-2 border rounded w-full md:w-64"
        />
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          className="p-2 border rounded"
        >
          <option value="added">Sort by Added</option>
          <option value="alpha">Sort Alphabetically</option>
          <option value="year">Sort by Year</option>
        </select>
        <div className="flex gap-2 items-center">
          <button
            className={`px-3 py-1 rounded ${viewType === "grid" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
            onClick={() => setViewType("grid")}
          >
            Grid
          </button>
          <button
            className={`px-3 py-1 rounded ${viewType === "column" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
            onClick={() => setViewType("column")}
          >
            Column
          </button>
        </div>
      </div>
      {/* No results message */}
      {sortedEntries.length === 0 ? (
        <p className="text-gray-500">{search ? `No entry found for "${search}".` : "No entries found."}</p>
      ) : viewType === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {sortedEntries.map(item => (
            <div
              key={item._id}
              className="border rounded-lg p-4 bg-white shadow-lg hover:shadow-xl transition-shadow flex flex-col"
            >
              {item.imageUrl && (
                <div className="w-full h-48 bg-gray-200 rounded mb-4 overflow-hidden flex items-center justify-center">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="object-cover h-full w-full"
                  />
                </div>
              )}
              <h2 className="text-xl font-semibold">{item.title}</h2>
              <p className="text-sm text-gray-600">{item.creator} ({item.releaseYear})</p>
              <p className="mt-2">Rating: {item.rating} / 10</p>
              <p className="text-gray-700 mt-2">{item.content}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {sortedEntries.map(item => (
            <div
              key={item._id}
              className="border rounded-lg p-4 flex gap-4 bg-white shadow-lg hover:shadow-xl transition-shadow"
            >
              {item.imageUrl && (
                <div className="w-24 h-32 bg-gray-200 rounded flex-shrink-0">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover rounded"
                  />
                </div>
              )}
              <div className="flex-1">
                <h2 className="text-xl font-semibold">{item.title}</h2>
                <p className="text-sm text-gray-600">{item.creator} ({item.releaseYear})</p>
                <p className="mt-2">Rating: {item.rating} / 10</p>
                <p className="text-gray-700">{item.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default CompletedEntries;
