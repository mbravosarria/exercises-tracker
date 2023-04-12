const express = require("express")
const app = express()
const cors = require("cors")
require("dotenv").config()
const mongoose = require("mongoose")
const { Schema } = mongoose

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to DB successfully"))
  .catch(error => console.log(error))

const userSchema = new Schema(
  {
    username: {
      type: String,
      unique: true,
    },
  },
  { versionKey: false }
)
const User = mongoose.model("User", userSchema)

const exerciseSchema = new Schema(
  {
    username: String,
    description: String,
    duration: Number,
    date: Date,
    userId: String,
  },
  { versionKey: false }
)
const Exercise = mongoose.model("Exercise", exerciseSchema)

app.use(cors())
app.use(express.static("public"))
app.use(express.urlencoded({ extended: true }))
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html")
})

// GET request to /api/users
app.get("/api/users", async (req, res) => {
  const users = await User.find()
  res.json(users)
})

// POST to /api/users username
app.post("/api/users", async (req, res) => {
  const username = req.body.username
  const foundUser = await User.findOne({ username })

  if (foundUser) return res.json(foundUser)

  const user = await User.create({
    username,
  })

  res.json(user)
})

// POST to /api/users/:_id/exercises with form data description, duration, and optionally date
app.post("/api/users/:_id/exercises", async (req, res, next) => {
  const userId = req.params._id
  let validId = true
  let { description, duration, date } = req.body
  const foundUser = await User.findById(userId).catch(error => {
    validId = false
  })

  if (!foundUser || !validId)
    return res.json({ error: "No user exists for that id" })

  date = !date ? new Date() : new Date(date)

  if (date.toDateString() === "Invalid Date")
    return res.json({ error: "Invalid Date" })

  Exercise.create({
    username: foundUser.username,
    userId,
    description,
    duration: Number(duration),
    date,
  })

  res.json({
    username: foundUser.username,
    _id: userId,
    description,
    duration: Number(duration),
    date: formatDate(date.toUTCString()),
  })
})

// GET request to /api/users/:_id/logs
app.get("/api/users/:_id/logs", async (req, res) => {
  let { from, to, limit } = req.query
  console.log("🚀 ~ file: index.js:100 ~ app.get ~ limit:", limit)
  console.log("🚀 ~ file: index.js:100 ~ app.get ~ to:", to)
  console.log("🚀 ~ file: index.js:100 ~ app.get ~ from:", from)
  const userId = req.params._id
  let validId = true
  const foundUser = await User.findById(userId).catch(error => {
    validId = false
  })

  if (!foundUser || !validId)
    return res.json({ error: "No user exists for that id" })

  let filter = { userId }
  let dateFilter = {}
  if (from) dateFilter["$gte"] = new Date(from)
  if (to) dateFilter["$lt"] = new Date(to)
  if (from || to) filter.date = dateFilter

  if (!limit) limit = 100

  console.log("🚀 ~ file: index.js:113 ~ app.get ~ filter:", filter)
  let exercises = await Exercise.find(filter).limit(limit)
  console.log("🚀 ~ file: index.js:121 ~ app.get ~ exercises:", exercises)
  exercises = exercises.map(exercise => {
    console.log(formatDate(exercise.date.toUTCString()))
    return {
      description: exercise.description,
      duration: Number(exercise.duration),
      date: formatDate(exercise.date.toUTCString()),
    }
  })

  res.json({
    username: foundUser.username,
    count: exercises.length,
    _id: userId,
    log: exercises,
  })
})

const formatDate = dateString => {
  const weekDay = dateString.split(",")[0]
  const day = dateString.split(" ")[1]
  const month = dateString.split(" ")[2]
  const year = dateString.split(" ")[3]

  return `${weekDay} ${month} ${day} ${year}`
}

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port)
})
