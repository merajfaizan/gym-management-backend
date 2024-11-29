const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
require("dotenv").config();
const { MongoClient, ServerApiVersion } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;

// middlewares
app.use(cors());
app.use(express.json());

// connect to database
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.k5v5ibx.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// api routes
async function run() {
  try {
    // await client.connect();
    const database = client.db("gym-management");
    const usersCollection = database.collection("users");

    // jwt related api
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "24h",
      });
      res.send({ token });
    });

    // middlewares
    const verifyToken = (req, res, next) => {
      if (!req.headers.authorization) {
        return res.status(401).send({ message: "unauthorized access" });
      }
      const token = req.headers.authorization.split(" ")[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: "unauthorized access" });
        }
        req.decoded = decoded;
        next();
      });
    };

    // Register endpoint
    app.post("/register", async (req, res) => {
      const { name, email, role, password } = req.body;

      try {
        // Check if the email already exists
        const existingUser = await usersCollection.findOne({ email });

        if (existingUser) {
          return res.status(400).json({ message: "Email already exists" });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Created a new user instance
        const user = {
          name,
          email,
          role,
          password: hashedPassword,
        };

        // Save the user to the database
        await usersCollection.insertOne(user);

        // Generate a JWT
        const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
          expiresIn: "24h",
        });

        // Send a success response
        res.status(201).json({
          user: { name, email, role },
          token,
          message: "Successfully registered",
        });
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
      }
    });

    // Login endpoint
    app.post("/login", async (req, res) => {
      const { email, password } = req.body;
      try {
        // Check if the email exists
        const user = await usersCollection.findOne({ email });

        if (!user) {
          return res.status(400).json({ message: "Email is not registered" });
        }

        // Check if the password is correct
        const isPasswordCorrect = await bcrypt.compare(password, user.password);

        if (isPasswordCorrect) {
          // Generate a JWT
          const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
            expiresIn: "24h",
          });

          // Get the user data
          const { name, email, role } = user;

          // Send a success response
          res
            .status(201)
            .json({
              user: { name, email, role },
              token,
              message: "Login successful",
            });
        } else {
          res.status(400).json({ message: "password is incorrect" });
        }
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
      }
    });
  } finally {
    // await client.close(console.log("database is closed"));
  }
}
run().catch((err) => console.log(err));

// initial api routes and listen.
app.get("/", (req, res) => {
  res.send("Gym management server is online");
});

app.listen(port, () => {
  console.log(`Gym management server listening on port ${port}`);
});