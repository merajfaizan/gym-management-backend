# Gymnasia - Gym Class Scheduling and Membership Management System

## Project Overview

The **Gymnasia** system is designed to manage gym operations efficiently by defining roles for Admin, Trainer, and Trainee.

- **Admin**: Responsible for creating and managing trainers, scheduling classes, and assigning trainers. Admins can schedule up to 5 classes per day, each lasting 2 hours.
- **Trainer**: Trainers conduct assigned classes and can view their schedules but cannot create or manage trainee profiles.
- **Trainee**: Trainees can create/manage their profiles and book classes with a capacity limit of 10 trainees per class.

The system enforces robust business rules for scheduling, booking, and user access, with JWT-based authentication and error handling.

---

## **API Endpoints**

### **Authentication**

| Method | Endpoint    | Description        | Parameters                      | Response                                                                                                  |
| ------ | ----------- | ------------------ | ------------------------------- | --------------------------------------------------------------------------------------------------------- |
| POST   | `/jwt`      | Generate JWT token | `{user: {name, email}}`         | `{ "token": "string" }`                                                                                   |
| POST   | `/register` | Register new user  | `{name, email, role, password}` | `{ "user": { "_id", "name", "email", "role" }, "token": "string", "message": "Successfully registered" }` |
| POST   | `/login`    | User login         | `{email, password}`             | `{ "user": { "_id", "name", "email", "role" }, "token": "string", "message": "Login successful" }`        |

---

### **Trainers**

| Method | Endpoint        | Description            | Parameters                                           | Response                                                            |
| ------ | --------------- | ---------------------- | ---------------------------------------------------- | ------------------------------------------------------------------- |
| POST   | `/trainers`     | Add new trainer        | `{avatar, name, role, subject, description, gender}` | `{ "message": "Trainer added successfully", "trainer": {object} }`  |
| GET    | `/trainers`     | Get all trainers       | -                                                    | `[{ "trainer": {object} }]`                                         |
| GET    | `/trainers/:id` | Get trainer by ID      | -                                                    | `{ "trainer": {object} }`                                           |
| PUT    | `/trainers/:id` | Update trainer details | `{avatar, name, role, subject, description, gender}` | `{ "message": "Trainer updated successfully", "result": {object} }` |
| DELETE | `/trainers/:id` | Delete trainer         | -                                                    | `{ "message": "Trainer deleted successfully", "result": {object} }` |

---

### **Classes**

| Method | Endpoint                    | Description                      | Parameters                                        | Response                                                                      |
| ------ | --------------------------- | -------------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------- |
| POST   | `/classes`                  | Schedule a new class             | `{name, time, trainer, img, day, bookedTrainees}` | `{ "message": "Class scheduled successfully", "result": {object} }`           |
| GET    | `/classes`                  | Get all scheduled classes        | -                                                 | `[{ "class": {object} }]`                                                     |
| GET    | `/classes/by-day`           | Get classes grouped by day       | -                                                 | `{ "day": [{ "class": {object}, "trainer": {object} }] }`                     |
| PUT    | `/classes/:classId/reserve` | Reserve a class for a user       | `{classId, userId}`                               | `{ "message": "Class reserved successfully" }`                                |
| GET    | `/classes-with-trainees`    | Get classes with trainee details | -                                                 | `[{ "class": {object}, "bookedTrainees": [{ "user": {object} }] }]`           |
| GET    | `/booked-classes/:userId`   | Get booked classes for a user    | -                                                 | `[{ "class": {object}, "trainer": { "name": "string", "email": "string" } }]` |

---

### **General**

| Method | Endpoint | Description         | Parameters | Response                                           |
| ------ | -------- | ------------------- | ---------- | -------------------------------------------------- |
| GET    | `/`      | Check server status | -          | `{ "message": "Gym management server is online" }` |

---

### **Error Responses**

| Status Code | Message               | Example Response                                    |
| ----------- | --------------------- | --------------------------------------------------- |
| 401         | Unauthorized access   | `{ "message": "Unauthorized access" }`              |
| 403         | Forbidden             | `{ "message": "Forbidden: Admin access required" }` |
| 404         | Resource not found    | `{ "message": "Resource not found" }`               |
| 500         | Internal server error | `{ "message": "Internal server error" }`            |

---

## Run Locally

Clone the project

```bash
  https://github.com/merajfaizan/gym-management-backend.git
```

Go to the project directory

```bash
  cd gym-management-backend
```

Install dependencies

```bash
  npm install
```

Set up environment variables:

- Create a .env file in the server directory with the following:

```bash
  DB_USER = "DB_ADMIN2"
  DB_PASS = "dLuIOsC08K2IYZ9p"
  ACCESS_TOKEN_SECRET = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjM0NSIsInVzZXJuYW1lIjoiZXhhbXBsZVVzZXIiLCJpYXQiOjE2NTk1MjI3NjYsImV4cCI6MTY1OTUyMzE2Nn0.s8qDbfEj6Gz8oZ0Fys96J7gHo_5zKRYgD6pQwHlP9Yk"


```

Start the server

```bash
  npm run start
```

## Demo

Live Api link: [https://gym-management-backend-kappa.vercel.app/]

## Documentation

For For frontend code visit my this repo

[Frontend repo](https://github.com/merajfaizan/gym-management-frontend)
