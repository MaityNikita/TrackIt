import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Notification from "./Notification";
import { TMDB_API_KEY, TMDB_BASE_URL, TMDB_IMAGE_BASE_URL } from "../config";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिन्दी" },
  { code: "hinglish", label: "Hinglish" },
];

function EntryPage() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState([]);
  const [newEntry, setNewEntry] = useState({
    title: "",
    type: "movie", // movie, book, game, etc.
    releaseYear: "",
    creator: "", // author/director
    category: "",
    content: "",
    imageUrl: "",
    rating: 0,
  });
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState({ type: "all", sortBy: "date" });
  const [theme, setTheme] = useState("light");
  const [language, setLanguage] = useState("en");

  // Theme toggling
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  // Language text map
  const TEXT = {
    en: {
      mediaDiary: "Media Diary",
      allTypes: "All Types",
      movies: "Movies",
      tv: "TV Shows",
      books: "Books",
      games: "Games",
      sortByDate: "Sort by Date",
      sortByRating: "Sort by Rating",
      sortByTitle: "Sort by Title",
      addEntry: "Add Entry",
      title: "Title",
      type: "Type",
      releaseYear: "Release Year",
      creator: "Author/Director",
      category: "Category",
      rating: "Rating",
      content: "Content/Overview",
      submit: "Submit",
    },
    hi: {
      mediaDiary: "मीडिया डायरी",
      allTypes: "सभी प्रकार",
      movies: "फिल्में",
      tv: "टीवी शो",
      books: "किताबें",
      games: "गेम्स",
      sortByDate: "तारीख से छाँटें",
      sortByRating: "रेटिंग से छाँटें",
      sortByTitle: "शीर्षक से छाँटें",
      addEntry: "एंट्री जोड़ें",
      title: "शीर्षक",
      type: "प्रकार",
      releaseYear: "रिलीज़ वर्ष",
      creator: "लेखक/निर्देशक",
      category: "श्रेणी",
      rating: "रेटिंग",
      content: "सामग्री/सारांश",
      submit: "जमा करें",
    },
    hinglish: {
      mediaDiary: "Media Diary",
      allTypes: "Sabhi Type",
      movies: "Movies",
      tv: "TV Shows",
      books: "Kitaabein",
      games: "Games",
      sortByDate: "Date se Sort karo",
      sortByRating: "Rating se Sort karo",
      sortByTitle: "Title se Sort karo",
      addEntry: "Entry Add karo",
      title: "Title",
      type: "Type",
      releaseYear: "Release Year",
      creator: "Author/Director",
      category: "Category",
      rating: "Rating",
      content: "Content/Overview",
      submit: "Submit karo",
    },
  };

  const fetchEntries = useCallback(async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/entries");
      let filteredEntries = response.data;

      // Apply type filter
      if (filter.type !== "all") {
        filteredEntries = filteredEntries.filter(
          (entry) => entry.type === filter.type
        );
      }

      // Apply sorting
      filteredEntries.sort((a, b) => {
        if (filter.sortBy === "date") {
          return new Date(b.date) - new Date(a.date);
        } else if (filter.sortBy === "rating") {
          return b.rating - a.rating;
        } else if (filter.sortBy === "title") {
          return a.title.localeCompare(b.title);
        }
        return 0;
      });

      setEntries(filteredEntries);
    } catch (error) {
      showNotification("Error fetching entries", "error");
    }
  }, [filter]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const fetchMediaInfo = async (title, type) => {
    setIsLoading(true);
    try {
      if (type === "movie" || type === "tv") {
        const response = await axios.get(`${TMDB_BASE_URL}/search/${type}`, {
          params: {
            api_key: TMDB_API_KEY,
            query: title,
            language: "en-US",
            page: 1,
            include_adult: false,
          },
        });

        if (response.data.results.length > 0) {
          const media = response.data.results[0];

          // Fetch additional details
          const detailsResponse = await axios.get(
            `${TMDB_BASE_URL}/${type}/${media.id}`,
            {
              params: {
                api_key: TMDB_API_KEY,
                language: "en-US",
              },
            }
          );

          const details = detailsResponse.data;

          setNewEntry((prev) => ({
            ...prev,
            title: type === "movie" ? details.title : details.name,
            releaseYear:
              details.release_date?.split("-")[0] ||
              details.first_air_date?.split("-")[0] ||
              "",
            imageUrl: media.poster_path
              ? `${TMDB_IMAGE_BASE_URL}${media.poster_path}`
              : "",
            creator:
              type === "movie"
                ? details.director
                : details.created_by?.[0]?.name || "",
            category:
              details.genres?.map((genre) => genre.name).join(", ") || "",
            content: details.overview || "",
          }));

          showNotification(
            "Media information fetched successfully!",
            "success"
          );
        } else {
          showNotification("No media found with that title", "error");
        }
      } else if (type === "book") {
        const response = await axios.get(
          `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(
            title
          )}`
        );
        if (response.data.items?.length > 0) {
          const book = response.data.items[0].volumeInfo;
          setNewEntry((prev) => ({
            ...prev,
            releaseYear: book.publishedDate?.split("-")[0] || "",
            imageUrl: book.imageLinks?.thumbnail || "",
            creator: book.authors?.[0] || "",
            category: book.categories?.[0] || "",
          }));
        }
      }
    } catch (error) {
      console.error("Error fetching media info:", error);
      showNotification("Error fetching media info. Please try again.", "error");
    }
    setIsLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5000/api/entries", newEntry);
      setNewEntry({
        title: "",
        type: "movie",
        releaseYear: "",
        creator: "",
        category: "",
        content: "",
        imageUrl: "",
        rating: 0,
      });
      fetchEntries();
      showNotification("Entry added successfully!", "success");
    } catch (error) {
      showNotification("Error adding entry", "error");
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/entries/${id}`);
      fetchEntries();
      showNotification("Entry deleted successfully!", "success");
    } catch (error) {
      showNotification("Error deleting entry", "error");
    }
  };

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(
      () => setNotification({ show: false, message: "", type: "" }),
      3000
    );
  };

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        theme === "dark"
          ? "bg-gray-900 text-gray-100"
          : "bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 text-gray-900"
      }`}
    >
      {/* Header */}
      <header
        className={`w-full shadow-md py-6 px-4 flex flex-col md:flex-row md:items-center md:justify-between mb-8 ${
          theme === "dark" ? "bg-gray-800" : "bg-white/80"
        }`}
      >
        <h1
          className="text-4xl font-extrabold tracking-tight text-center md:text-left"
          style={{ letterSpacing: "2px" }}
        >
          {TEXT[language].mediaDiary}
        </h1>
        <div className="flex gap-4 mt-4 md:mt-0 justify-center md:justify-end items-center">
          {/* Theme toggle */}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="px-3 py-1 rounded border border-gray-400 bg-gray-200 dark:bg-gray-700 dark:text-gray-100"
            title={theme === "dark" ? "Switch to Day" : "Switch to Night"}
          >
            {theme === "dark" ? "🌞 Day" : "🌙 Night"}
          </button>
          {/* Language selector */}
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="p-2 rounded border border-gray-400 bg-gray-100 dark:bg-gray-700 dark:text-gray-100"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.label}
              </option>
            ))}
          </select>
        </div>
      </header>

      <div className="p-6 max-w-4xl mx-auto">
        {/* Filters */}
        <div className="mb-6 flex gap-4 flex-wrap">
          <select
            value={filter.type}
            onChange={(e) =>
              setFilter((prev) => ({ ...prev, type: e.target.value }))
            }
            className="p-2 border rounded"
          >
            <option value="all">{TEXT[language].allTypes}</option>
            <option value="movie">{TEXT[language].movies}</option>
            <option value="tv">{TEXT[language].tv}</option>
            <option value="book">{TEXT[language].books}</option>
            <option value="game">{TEXT[language].games}</option>
          </select>

          <select
            value={filter.sortBy}
            onChange={(e) =>
              setFilter((prev) => ({ ...prev, sortBy: e.target.value }))
            }
            className="p-2 border rounded"
          >
            <option value="date">{TEXT[language].sortByDate}</option>
            <option value="rating">{TEXT[language].sortByRating}</option>
            <option value="title">{TEXT[language].sortByTitle}</option>
          </select>
        </div>

        {/* Add Entry Form */}
        <form
          onSubmit={handleSubmit}
          className={`mb-8 p-6 rounded-lg shadow-md ${
            theme === "dark" ? "bg-gray-800" : "bg-white/80"
          }`}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                {TEXT[language].title}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newEntry.title}
                  onChange={(e) =>
                    setNewEntry({ ...newEntry, title: e.target.value })
                  }
                  className="w-full p-2 border rounded"
                  required
                />
                <button
                  type="button"
                  onClick={() => fetchMediaInfo(newEntry.title, newEntry.type)}
                  disabled={isLoading || !newEntry.title}
                  className={`px-4 py-2 rounded font-medium ${
                    isLoading || !newEntry.title
                      ? "bg-gray-300 cursor-not-allowed"
                      : "bg-blue-500 hover:bg-blue-600 text-white"
                  }`}
                >
                  {isLoading ? "Fetching..." : "Fetch"}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                {TEXT[language].type}
              </label>
              <select
                value={newEntry.type}
                onChange={(e) =>
                  setNewEntry({ ...newEntry, type: e.target.value })
                }
                className="w-full p-2 border rounded"
              >
                <option value="movie">{TEXT[language].movies}</option>
                <option value="tv">{TEXT[language].tv}</option>
                <option value="book">{TEXT[language].books}</option>
                <option value="game">{TEXT[language].games}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                {TEXT[language].releaseYear}
              </label>
              <input
                type="number"
                value={newEntry.releaseYear}
                onChange={(e) =>
                  setNewEntry({ ...newEntry, releaseYear: e.target.value })
                }
                className="w-full p-2 border rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                {TEXT[language].creator}
              </label>
              <input
                type="text"
                placeholder={TEXT[language].creator}
                value={newEntry.creator}
                onChange={(e) =>
                  setNewEntry({ ...newEntry, creator: e.target.value })
                }
                className="w-full p-2 border rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                {TEXT[language].category}
              </label>
              <input
                type="text"
                value={newEntry.category}
                onChange={(e) =>
                  setNewEntry({ ...newEntry, category: e.target.value })
                }
                className="w-full p-2 border rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                {TEXT[language].rating}
              </label>
              <input
                type="number"
                min="0"
                max="10"
                step="0.1"
                value={newEntry.rating}
                onChange={(e) =>
                  setNewEntry({ ...newEntry, rating: e.target.value })
                }
                className="w-full p-2 border rounded"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">
                {TEXT[language].content}
              </label>
              <textarea
                value={newEntry.content}
                onChange={(e) =>
                  setNewEntry({ ...newEntry, content: e.target.value })
                }
                className="w-full p-2 border rounded"
                rows={3}
              />
            </div>
          </div>
          <button
            type="submit"
            className={`mt-4 px-6 py-2 rounded font-bold shadow ${
              theme === "dark"
                ? "bg-blue-600 text-white"
                : "bg-gradient-to-r from-blue-500 to-pink-500 text-white"
            }`}
          >
            {TEXT[language].submit}
          </button>
        </form>

        {/* Entries List */}
        <div className="space-y-4">
          {entries.map((entry) => (
            <div
              key={entry._id}
              className="border p-4 rounded bg-white shadow-sm"
            >
              <div className="flex gap-4">
                {entry.imageUrl && (
                  <img
                    src={entry.imageUrl}
                    alt={entry.title}
                    className="w-32 h-48 object-cover rounded"
                  />
                )}
                <div className="flex-1">
                  <h2 className="text-xl font-semibold">{entry.title}</h2>
                  <div className="mt-2 text-sm text-gray-600">
                    <p>Type: {entry.type}</p>
                    <p>Year: {entry.releaseYear}</p>
                    <p>Creator: {entry.creator}</p>
                    <p>Category: {entry.category}</p>
                    <p>Rating: {entry.rating}/10</p>
                  </div>
                  <p className="mt-2">{entry.content}</p>
                  <div className="mt-4 flex justify-between items-center">
                    <span className="text-gray-500">
                      {new Date(entry.date).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => handleDelete(entry._id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Notification */}
        {notification.show && (
          <Notification
            message={notification.message}
            type={notification.type}
          />
        )}

        {/* View Completed Entries Button */}
        <button
          onClick={() => navigate("/completed-entries")}
          className="mt-8 bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors"
        >
          View Completed Entries
        </button>
      </div>
    </div>
  );
}

export default EntryPage;
