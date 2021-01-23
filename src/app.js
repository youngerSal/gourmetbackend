require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
// const helmet = require("helmet");
const { NODE_ENV } = require("./config");
var { graphqlHTTP } = require("express-graphql");
const schema = require("./schema");
const DatabaseService = require("./database-service");
// const fetch = require("./database-service");

const app = express();
const jsonParser = express.json();

const morganOption = NODE_ENV === "production" ? "tiny" : "common";

app.use(morgan(morganOption));
// app.use(helmet()); TURN ON FOR PRODUCTION!!!!!!!!!!!!!!!!!!

const corsOptions = {
  origin: [
    "https://muscled-store.myshopify.com",
    "https://d0c23edbb2c1.ngrok.io",
  ],
  optionsSuccessStatus: 200,
};

// fetch();

app.use(
  "/graphql",
  jsonParser,
  cors(corsOptions),
  graphqlHTTP((req) => ({
    schema: schema,
    graphiql: true,
    pretty: true,
  }))
);

app.post("/api/product", jsonParser, async (req, res, next) => {
  //6527e5de7b0af7ed393d7b8b842c7bfdca463ed4d797a8318c7763de5b0e9e88
  //for authentication purposes
  console.log(req.body);
  console.log(req.body.id);
  console.log(req.body.title);
  DatabaseService.writeProductToTable(req.body.id, req.body.title);
  //CODE TO SEND THIS DATA TO DYNAMODB TO THE TABLE LISTED PRODUCTS

  res.status(200);
});

app.post("/api/shopify/order", jsonParser, async (req, res, next) => {
  // console.log(req.body);

  req.body.line_items.map((item) => {
    console.log(req.body.customer.email, "this right here");
    const customer_info = {
      "owner-email": req.body.customer.email
        ? req.body.customer.email
        : "not given",
      "owner-name": `${req.body.customer.first_name} ${req.body.customer.last_name}`,
      origin: "shopify",
      "product-id": item.product_id,
    };
    DatabaseService.addCustomerRegistration(customer_info);
  });

  //NOT FULLY TESTED, NEED INTERFACE, AND TO ADD WARRANTIES

  res.status(200);
});

//WEBHOOK EVERY TIME PRODUCT IS PURCHASED FROM SHOPIFY GOURMET EASY STORE
//ADD DIRECTLY TO WARRANTIES TABLE **IF WARRANTY EXISTS, IF NOT REJECT AND NOTIFY CLIENT**
//ADD PRODUCT_ID, OWNER-NAME, OWNER-EMAIL, BOUGHT-FROM SHOPIFY, PRODUCT NAME, WARRANTY DURATION,
//START OF WARRANTY

app.use(function errorHandler(error, req, res, next) {
  let response;
  if (NODE_ENV === "production") {
    response = { error: { message: "server error" } };
  } else {
    console.error(error);
    response = { message: error.message, error };
  }
  res.status(500).json(response);
});

module.exports = app;
