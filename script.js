const apiURL = "https://restcountries.com/v3.1/all";
const container = document.getElementById("cards-container");
const modal = document.getElementById("modal");
const modalContent = document.getElementById("modal-content");
const searchInput = document.getElementById("search");
const regionFilter = document.getElementById("region-filter");
const sortBySelect = document.getElementById("sort-by");

let countriesData = [];
let currentPage = 1;
const itemsPerPage = 12;
let countryCodeMap = {};

// Fetch all countries once
fetch(apiURL)
  .then((response) => {
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    return response.json();
  })
  .then((data) => {
    countriesData = data;

    // Create a map for easy lookup of countries by code
    countriesData.forEach((country) => {
      if (country.cca3) {
        countryCodeMap[country.cca3] = country;
      }
    });

    populateRegionFilter();
    renderCountries();
  })
  .catch((error) => {
    console.error("Error fetching countries:", error);
    container.innerHTML = `
          <section class="no-results">
            <h2>😢 Couldn't load countries</h2>
            <p>Please check your connection and try again.</p>
          </section>
        `;
  });

// Render cards with pagination and filters
function renderCountries() {
  // Show loading spinner
  if (countriesData.length === 0) {
    container.innerHTML = '<section class="spinner"></section>';
    return;
  }

  // Clear previous content
  container.innerHTML = "";
  container.classList.remove("loading");

  const searchTerm = searchInput.value.toLowerCase();
  const selectedRegion = regionFilter.value;
  const sortBy = sortBySelect.value;

  let filtered = countriesData.filter((country) => {
    const name = country.name?.common?.toLowerCase() || "";
    const officialName = country.name?.official?.toLowerCase() || "";
    const id = country.cca3?.toLowerCase() || "";
    const region = country.region || "";
    const capital = country.capital?.[0]?.toLowerCase() || "";

    const matchesSearch =
      name.includes(searchTerm) ||
      id.includes(searchTerm) ||
      officialName.includes(searchTerm) ||
      capital.includes(searchTerm);

    const matchesRegion = selectedRegion === "All" || region === selectedRegion;

    return matchesSearch && matchesRegion;
  });

  // Sort the filtered countries
  filtered.sort((a, b) => {
    if (sortBy === "name") {
      return (a.name?.common || "").localeCompare(b.name?.common || "");
    } else if (sortBy === "population") {
      return (b.population || 0) - (a.population || 0);
    } else if (sortBy === "area") {
      return (b.area || 0) - (a.area || 0);
    }
    return 0;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
          <section class="no-results">
            <h2>No countries found</h2>
            <p>Try adjusting your search or filters</p>
          </section>
        `;
    document.getElementById("pagination").innerHTML = "";
    return;
  }

  const start = (currentPage - 1) * itemsPerPage;
  const paginated = filtered.slice(start, start + itemsPerPage);

  paginated.forEach((country) => {
    const card = document.createElement("section");
    card.className = "card";
    const flag = country.flags?.png || country.flags?.svg || "";
    const name = country.name?.common || "Unknown";
    const capital = country.capital?.[0] || "No Capital";
    const region = country.region || "Unknown";
    const subregion = country.subregion || "Unknown";
    const population = country.population?.toLocaleString() || "N/A";

    card.setAttribute("data-name", name);
    card.setAttribute("data-id", country.cca3 || "");

    card.innerHTML = `
          <img src="${flag}" alt="Flag of ${name}" loading="lazy" onerror="this.src='https://via.placeholder.com/250x150?text=No+Flag'"/>
          <section class="card-content">
            <h2 title="${name}">${name}</h2>
            <p><strong>Population:</strong> ${population}</p>
            <p><strong>Region:</strong> ${region}</p>
            <p><strong>Capital:</strong> ${capital}</p>
          </section>
        `;

    card.addEventListener("click", () => {
      showCountryDetails(country);
    });

    container.appendChild(card);
  });

  renderPagination(filtered.length);
}


