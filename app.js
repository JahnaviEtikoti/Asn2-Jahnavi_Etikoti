const express = require("express");
const path = require("path");
const { engine } = require("express-handlebars");
const { query, validationResult } = require("express-validator");
const port = process.env.PORT || 3000;
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

// -------------------- LOAD DATA --------------------
const airbnb = require("./airbnb_with_photos.json");

// -------------------- ROUTES --------------------
app.get("/", (req, res) => {
  res.render("index", { title: "Express" });
});

app.get("/viewData", (req, res) => {
  res.render("viewData", {
    title: "View Data",
    properties: airbnb,
    year: new Date().getFullYear(),
  });
});

// -------------------- Step 7: Cleaned Data View --------------------
app.get("/viewData/clean", (req, res) => {
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
  (req, res) => {
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
