const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
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
    const trainersCollection = database.collection("trainers");
    const classesCollection = database.collection("classes");

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
      const authorization = req.headers;
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
        const response = await usersCollection.insertOne(user);

        // Generate a JWT
        const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
          expiresIn: "24h",
        });

        // Send a success response
        res.status(201).json({
          user: {_id: response.insertedId, name, email, role },
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
          const { _id ,name, email, role } = user;

          // Send a success response
          res.status(201).json({
            user: {_id, name, email, role },
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

    // Trainer API: Add a new trainer (Protected)
    app.post("/trainers", verifyToken, async (req, res) => {
      const { avatar, name, role, subject, description, gender } = req.body;

      // Check if the user is an admin
      if (req.decoded.role !== "admin") {
        return res
          .status(403)
          .json({ message: "Forbidden: Admin access required" });
      }

      if (!avatar || !name || !role || !subject || !description || !gender) {
        return res.status(400).json({ message: "All fields are required" });
      }

      try {
        const trainer = { avatar, name, role, subject, description, gender };
        const result = await trainersCollection.insertOne(trainer);

        res.status(201).json({
          message: "Trainer added successfully",
          trainer: result,
        });
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to add trainer" });
      }
    });

    // Trainer API: Get all trainers (Public)
    app.get("/trainers", async (req, res) => {
      try {
        const trainers = await trainersCollection.find().toArray();
        res.status(200).json(trainers);
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to retrieve trainers" });
      }
    });

    // Get a single trainer by ID (Protected)
    app.get("/trainers/:id", verifyToken, async (req, res) => {
      const { id } = req.params;

      // Check if the user is an admin
      if (req.decoded.role !== "admin") {
        return res
          .status(403)
          .json({ message: "Forbidden: Admin access required" });
      }

      try {
        const trainer = await trainersCollection.findOne({
          _id: new ObjectId(id),
        });
        if (trainer) {
          res.status(200).json(trainer);
        } else {
          res.status(404).json({ message: "Trainer not found" });
        }
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to retrieve trainer" });
      }
    });

    // Update a trainer (Protected)
    app.put("/trainers/:id", verifyToken, async (req, res) => {
      const { id } = req.params;
      const { avatar, name, role, subject, description, gender } = req.body;

      // Check if the user is an admin
      if (req.decoded.role !== "admin") {
        return res
          .status(403)
          .json({ message: "Forbidden: Admin access required" });
      }

      try {
        const updatedTrainer = {
          avatar,
          name,
          role,
          subject,
          description,
          gender,
        };
        const result = await trainersCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: updatedTrainer }
        );

        if (result.matchedCount === 1) {
          res
            .status(200)
            .json({ message: "Trainer updated successfully", result });
        } else {
          res.status(404).json({ message: "Trainer not found" });
        }
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to update trainer" });
      }
    });

    // Trainer API: Delete a trainer (Protected)
    app.delete("/trainers/:id", verifyToken, async (req, res) => {
      const { id } = req.params;

      // Check if the user is an admin
      if (req.decoded.role !== "admin") {
        return res
          .status(403)
          .json({ message: "Forbidden: Admin access required" });
      }

      try {
        const result = await trainersCollection.deleteOne({
          _id: new ObjectId(id),
        });

        if (result.deletedCount === 1) {
          res
            .status(200)
            .json({ message: "Trainer deleted successfully", result });
        } else {
          res.status(404).json({ message: "Trainer not found", result });
        }
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to delete trainer" });
      }
    });

    // Class API: Create a new class
    app.post("/classes", verifyToken, async (req, res) => {
      const { name, time, trainer, img, day, bookedTrainees } = req.body;

      // Check if the user is an admin
      if (req.decoded.role !== "admin") {
        return res
          .status(403)
          .json({ message: "Forbidden: Admin access required" });
      }

      // Validate required fields
      if (!name || !time || !trainer || !day) {
        return res.status(400).json({ message: "All fields are required" });
      }

      try {
        const newClass = { name, time, trainer, img, day , bookedTrainees};
        const result = await classesCollection.insertOne(newClass);
        res
          .status(201)
          .json({ message: "Class scheduled successfully", result });
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to schedule class" });
      }
    });
    // Fetch all scheduled classes
    app.get("/classes", async (req, res) => {
      try {
        const classes = await classesCollection.find().toArray();
        res.status(200).json(classes);
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to retrieve classes" });
      }
    });

    // Class Api: get all classes by day
    app.get("/classes/by-day", async (req, res) => {
      try {
        // Fetch all classes from the database
        const classes = await classesCollection.find().toArray();
    
        // Fetch all trainers and create a mapping by trainer ID
        const trainers = await trainersCollection.find().toArray();
        const trainerMap = trainers.reduce((acc, trainer) => {
          acc[trainer._id] = {
            id: trainer._id,
            name: trainer.name,
            subject: trainer.subject,
            avatar: trainer.avatar,
          };
          return acc;
        }, {});
    
        // Transform classes into a structure grouped by day
        const classesByDay = classes.reduce((acc, classItem) => {
          const { day, trainer, ...rest } = classItem;
    
          // Attach trainer details from the trainerMap
          const trainerDetails = trainerMap[trainer] || {};
    
          const classWithTrainer = {
            ...rest,
            trainer: trainerDetails,
          };
    
          if (!acc[day]) {
            acc[day] = [];
          }
    
          acc[day].push(classWithTrainer);
          return acc;
        }, {});
    
        res.status(200).json(classesByDay);
      } catch (error) {
        console.error("Error fetching classes by day:", error);
        res.status(500).json({ message: "Failed to retrieve classes" });
      }
    });
    
    // Class Api: reserve class
    app.put("/classes/:classId/reserve", async (req, res) => {
      try {
        const { classId } = req.params;
        const { userId } = req.body;
    
        if (!userId) {
          return res.status(400).json({ message: "User ID is required" });
        }
    
        // Find the class to check reservations
        const classItem = await classesCollection.findOne({ _id: new ObjectId(classId) });
    
        if (!classItem) {
          return res.status(404).json({ message: "Class not found" });
        }
    
        // Check if the user has already reserved
        if (classItem.bookedTrainees.includes(userId)) {
          return res.status(400).json({ message: "You have already reserved this class" });
        }
    
        // Check if the class is fully booked
        if (classItem.bookedTrainees.length >= 10) {
          return res.status(400).json({ message: "Class is fully reserved" });
        }
    
        // Add the user ID to the bookedTrainees array
        const result = await classesCollection.updateOne(
          { _id: new ObjectId(classId) },
          { $addToSet: { bookedTrainees: userId } } // $addToSet ensures no duplicates
        );
    
        if (result.modifiedCount === 0) {
          return res.status(500).json({ message: "Failed to reserve the class" });
        }
    
        res.status(200).json({ message: "Class reserved successfully" });
      } catch (error) {
        console.error("Error reserving class:", error);
        res.status(500).json({ message: "Failed to reserve class" });
      }
    });
    
    // Class Api: get classes with trainee details
    app.get("/classes-with-trainees", async (req, res) => {
      try {
        // Fetch classes
        const classes = await classesCollection.find().toArray();
    
        // Populate booked trainees for each class
        const populatedClasses = await Promise.all(
          classes.map(async (classItem) => {
            if (classItem.bookedTrainees && classItem.bookedTrainees.length > 0) {
              const trainees = await usersCollection
                .find({ _id: { $in: classItem.bookedTrainees.map((id) => new ObjectId(id)) } })
                .toArray();
              return { ...classItem, bookedTrainees: trainees };
            }
            return { ...classItem, bookedTrainees: [] };
          })
        );
    
        res.status(200).json(populatedClasses);
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to retrieve classes with trainees" });
      }
    });
    
    // Class Api: classes by user
  app.get("/booked-classes/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    // Fetch classes where the user's ID exists in the `bookedTrainees` array
    const bookedClasses = await classesCollection
      .find({ bookedTrainees: userId })
      .toArray();

    // Populate trainer details from `usersCollection`
    const userIds = bookedClasses.map((classItem) => classItem.trainer);
    const trainers = await trainersCollection
      .find({ _id: { $in: userIds.map((id) => new ObjectId(id)) } })
      .toArray();

    // Map trainers to their respective classes
    const enrichedClasses = bookedClasses.map((classItem) => {
      const trainer = trainers.find(
        (trainer) => trainer._id.toString() === classItem.trainer
      );
      return {
        ...classItem,
        trainer: {
          name: trainer?.name || "Unknown",
          email: trainer?.email || "N/A",
        },
      };
    });

    res.status(200).json(enrichedClasses);
  } catch (error) {
    console.error("Error fetching booked classes:", error);
    res.status(500).json({ message: "Failed to retrieve booked classes." });
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
