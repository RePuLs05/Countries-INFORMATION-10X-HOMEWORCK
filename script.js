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

function showCountryDetails(country) {
      const nativeNames = country.name?.nativeName ? 
        Object.values(country.name.nativeName)
          .map((n) => n.common)
          .join(", ") : "N/A";
          
      const languages = country.languages ? 
        Object.values(country.languages).join(", ") : "N/A";
        
      const currencies = country.currencies ? 
        Object.values(country.currencies)
          .map((c) => `${c.name} (${c.symbol || 'No symbol'})`)
          .join(", ") : "N/A";
          
      const borders = country.borders ? country.borders : [];
      const timezone = country.timezones ? country.timezones.join(", ") : "N/A";
      const area = country.area ? country.area.toLocaleString() : "N/A";
      const flag = country.flags?.png || country.flags?.svg || "";
      const name = country.name?.common || "Unknown";
      const capital = country.capital?.[0] || "No Capital";
      const region = country.region || "Unknown";
      const subregion = country.subregion || "Unknown";
      const population = country.population?.toLocaleString() || "N/A";
      const tld = country.tld?.join(", ") || "N/A";

      let borderCountriesHTML = "";
      if (borders.length > 0) {
        borderCountriesHTML = borders.map(code => {
          const borderCountry = countryCodeMap[code];
          const countryName = borderCountry?.name?.common || code;
          return `<span class="border-country" data-code="${code}">${countryName}</span>`;
        }).join("");
      } else {
        borderCountriesHTML = "<span>None</span>";
      }

      modalContent.innerHTML = `
        <section class="modal-header">
          <h2>${name}</h2>
          <span class="close-btn" id="close-btn">&times;</span>
        </section>
        <section class="modal-flag">
          <img src="${flag}" alt="Flag of ${name}" />
        </section>
        <section class="country-details">
          <section class="details-column">
            <h3>Basic Information</h3>
            <section class="detail-item">
              <span class="detail-label">Official Name:</span>
              <span>${country.name?.official || "N/A"}</span>
            </section>
            <section class="detail-item">
              <span class="detail-label">Native Names:</span>
              <span>${nativeNames}</span>
            </section>
            <section class="detail-item">
              <span class="detail-label">Capital:</span>
              <span>${capital}</span>
            </section>
            <section class="detail-item">
              <span class="detail-label">Region:</span>
              <span>${region} / ${subregion}</span>
            </section>
            <section class="detail-item">
              <span class="detail-label">Population:</span>
              <span>${population}</span>
            </section>
          </section>
          <section class="details-column">
            <h3>Additional Details</h3>
            <section class="detail-item">
              <span class="detail-label">Area:</span>
              <span>${area} km²</span>
            </section>
            <section class="detail-item">
              <span class="detail-label">Languages:</span>
              <span>${languages}</span>
            </section>
            <section class="detail-item">
              <span class="detail-label">Currencies:</span>
              <span>${currencies}</span>
            </section>
            <section class="detail-item">
              <span class="detail-label">Top Level Domain:</span>
              <span>${tld}</span>
            </section>
            <section class="detail-item">
              <span class="detail-label">Timezones:</span>
              <span>${timezone}</span>
            </section>
          </section>
          <section class="border-countries">
            <h3>Border Countries</h3>
            <section class="border-countries-list">
              ${borderCountriesHTML}
            </section>
          </section>
        </section>
      `;

      modal.style.display = "block";
      
      // Close button event
      document.getElementById("close-btn").addEventListener("click", () => {
        modal.style.display = "none";
      });
      
      // Add click events to border countries
      document.querySelectorAll(".border-country").forEach(el => {
        el.addEventListener("click", () => {
          const countryCode = el.getAttribute("data-code");
          const borderCountry = countryCodeMap[countryCode];
          if (borderCountry) {
            showCountryDetails(borderCountry);
          }
        });
      });
    }

    // Region Filter Dropdown
    function populateRegionFilter() {
      const uniqueRegions = Array.from(
        new Set(countriesData.map((c) => c.region).filter(Boolean))
      ).sort();
      
      regionFilter.innerHTML = '<option value="All">All Regions</option>';
      
      uniqueRegions.forEach(region => {
        const option = document.createElement("option");
        option.value = region;
        option.textContent = region;
        regionFilter.appendChild(option);
      });
    }

    // Search Event
    searchInput.addEventListener("input", () => {
      currentPage = 1;
      renderCountries();
    });

    // Region filter event
    regionFilter.addEventListener("change", () => {
      currentPage = 1;
      renderCountries();
    });

    // Sort by event
    sortBySelect.addEventListener("change", () => {
      currentPage = 1;
      renderCountries();
    });

    // Pagination
    function renderPagination(totalItems) {
      const pages = Math.ceil(totalItems / itemsPerPage);
      const paginationContainer = document.getElementById("pagination");
      paginationContainer.innerHTML = "";

      // Don't show pagination if only one page
      if (pages <= 1) {
        return;
      }

      // Add previous button
      const prevBtn = document.createElement("button");
      prevBtn.innerHTML = "&laquo;";
      prevBtn.disabled = currentPage === 1;
      prevBtn.addEventListener("click", () => {
        if (currentPage > 1) {
          currentPage--;
          renderCountries();
        }
      });
      paginationContainer.appendChild(prevBtn);

      // Calculate which page buttons to show
      let startPage = Math.max(1, currentPage - 2);
      let endPage = Math.min(pages, startPage + 4);
      
      // Adjust if we're near the end
      if (endPage - startPage < 4) {
        startPage = Math.max(1, endPage - 4);
      }

      // Add page buttons
      for (let i = startPage; i <= endPage; i++) {
        const btn = document.createElement("button");
        btn.textContent = i;
        btn.className = i === currentPage ? "active" : "";
        btn.addEventListener("click", () => {
          currentPage = i;
          renderCountries();
        });
        paginationContainer.appendChild(btn);
      }

      // Add next button
      const nextBtn = document.createElement("button");
      nextBtn.innerHTML = "&raquo;";
      nextBtn.disabled = currentPage === pages;
      nextBtn.addEventListener("click", () => {
        if (currentPage < pages) {
          currentPage++;
          renderCountries();
        }
      });
      paginationContainer.appendChild(nextBtn);
    }
// Close modal on outside click
    window.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.style.display = "none";
      }
    });

    // Close modal with ESC key
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modal.style.display === "block") {
        modal.style.display = "none";
      }
    });