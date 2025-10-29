/*********************************************************************************
 * * ITE5315 – Assignment 2
 * * I declare that this assignment is my own work in accordance with Humber Academic Policy.
 * * No part of this assignment has been copied manually or electronically from any other source
 * * (including web sites) or distributed to other students.
 * * Name: Jahnavi Etikoti
 * * Student ID: N01687105
 * * Date: 2025-10-29
 * * ********************************************************************************/
const express = require("express");
const path = require("path");
const { engine } = require("express-handlebars");
const { query, validationResult } = require("express-validator");
const port = process.env.PORT || 3000;
const { get } = require("http");

const app = express();

// -------------------- VIEW ENGINE SETUP --------------------
app.engine(
  ".hbs",
  engine({
    helpers: {
      serviceFee: function (fee) {
        if (!fee || fee.trim() === "") {
          return "0";
        }
        return fee;
      },
      highlight: function (fee) {
        if (!fee || fee.trim() === "") {
          return "background-color: lightblue;";
        }
        return "";
      },
    },
    extname: ".hbs",
    defaultLayout: "main",
    layoutsDir: path.join(__dirname, "views/layouts"),
    partialsDir: path.join(__dirname, "views/partials"),
  })
);

app.set("view engine", ".hbs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

let airbnb = [];

// -------------------- LOAD DATA --------------------
async function loadData() {
  const base =
    "https://cdn.jsdelivr.net/gh/JahnaviEtikoti/Asn2-Jahnavi_Etikoti-JSON/";
  const indexUrl = base + "index.json";
  const index = await (await fetch(indexUrl)).json();

  const parts = await Promise.all(
    index.parts.map((file) => fetch(base + file).then((res) => res.json()))
  );

  return parts.flat();
}

// -------------------- ROUTES --------------------
// -------------------- Step 3: Home Route --------------------
app.get("/", (req, res) => {
  res.render("index", { title: "Express" });
});

// -------------------- Step 4: Basic Routes --------------------
app.get("/users", function (req, res) {
  res.send("respond with a resource");
});

// -------------------- Step 5 & 6: Airbnb Data Routes --------------------
app.get("/all-data", async (req, res) => {
  airbnb = await loadData();
  res.render("all-data", {
    title: "All Airbnb Properties",
    properties: airbnb,
    year: new Date().getFullYear(),
  });
});

// -------------------- Step 6: Individual Data View --------------------
app.get("/data/:index", async (req, res) => {
  airbnb = await loadData();
  const idx = parseInt(req.params.index);
  if (!isNaN(idx) && idx >= 0 && idx < airbnb.length) {
    const property = airbnb[idx];
    res.render("data", {
      title: "Property Details",
      property,
      year: new Date().getFullYear(),
    });
  } else {
    res.status(400).render("error", {
      title: "Error",
      message: "Invalid index!",
      year: new Date().getFullYear(),
    });
  }
});

// -------------------- Step 6: Search by ID and Name --------------------
app.get("/search/id", (req, res) => {
  res.render("search-id", {
    title: "Search by ID",
    year: new Date().getFullYear(),
  });
});
app.get("/search/property/result", async (req, res) => {
  airbnb = await loadData();
  const id = req.query.id;
  const property = airbnb.find((p) => p.id == id);
  if (property) {
    res.render("search-id-result", {
      title: "Property Found",
      property,
      year: new Date().getFullYear(),
    });
  } else {
    res.render("error", {
      title: "Not Found",
      message: "Property ID not found!",
      year: new Date().getFullYear(),
    });
  }
});
app.get("/search/name", (req, res) => {
  res.render("search-name", {
    title: "Search by Name",
    year: new Date().getFullYear(),
  });
});
app.get("/search/name/result", async (req, res) => {
  airbnb = await loadData();
  const query = (req.query.name || "").toLowerCase();
  if (!query) {
    return res.render("error", {
      title: "Error",
      message: "Please enter a name.",
      year: new Date().getFullYear(),
    });
  }
  const results = airbnb.filter(
    (p) => p.NAME && p.NAME.toLowerCase().includes(query)
  );
  if (results.length === 0) {
    res.render("error", {
      title: "No Results",
      message: "No properties found.",
      year: new Date().getFullYear(),
    });
  } else {
    res.render("search-name-result", {
      title: "Search Results",
      results,
      searchQuery: req.query.name,
      year: new Date().getFullYear(),
    });
  }
});

app.get("/viewData", async (req, res) => {
  airbnb = await loadData();
  res.render("viewData", {
    title: "View Data",
    properties: airbnb,
    year: new Date().getFullYear(),
  });
});

// -------------------- Step 7: Cleaned Data View --------------------
app.get("/viewData/clean", async (req, res) => {
  airbnb = await loadData();
  res.render("viewdata-clean", {
    title: "Cleaned Data",
    properties: airbnb,
    year: new Date().getFullYear(),
  });
});

// -------------------- Step 8: Search by Price Range --------------------
app.get("/viewData/price", (req, res) => {
  res.render("priceForm", { title: "Search by Price Range" });
});

app.get(
  "/viewData/price/result",
  [
    query("min")
      .trim()
      .isFloat({ min: 0 })
      .withMessage("Min price must be a number ≥ 0"),
    query("max")
      .trim()
      .isFloat({ min: 0 })
      .withMessage("Max price must be a number ≥ 0"),
  ],
  async (req, res) => {
    airbnb = await loadData();
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).render("priceForm", {
        title: "Search by Price Range",
        errors: errors.array(),
      });
    }
    const minPrice = parseFloat(req.query.min);
    const maxPrice = parseFloat(req.query.max);
    const filteredProperties = airbnb.filter((property) => {
      const price = parseFloat(property.price.replace(/[^0-9.-]+/g, ""));
      return price >= minPrice && price <= maxPrice;
    });
    res.render("priceResult", {
      title: "Price Range Results",
      properties: filteredProperties,
      year: new Date().getFullYear(),
      min: minPrice,
      max: maxPrice,
    });
  }
);

// -------------------- 404 HANDLER --------------------
app.use((req, res) => {
  res.status(404).render("error", {
    title: "Error",
    message: "Wrong Route or Page Not Found",
  });
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
