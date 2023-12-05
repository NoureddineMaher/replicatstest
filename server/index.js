const express = require("express");
const MongoClient = require("mongodb").MongoClient;
const assert = require("assert");
const cors = require("cors");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const port = 3001;
const corsOptions = {
    origin: 'http://localhost:3000',
    optionsSuccessStatus: 200,
    credentials: true,
};

app.use(cors(corsOptions));

const pipeline = [
    {
        $project: { documentKey: false }
    }
];

MongoClient.connect("mongodb+srv://maher:maher@cluster0.ctrzcqa.mongodb.net/")
    .then(client => {
        console.log("Connected correctly to server");
        const db = client.db("test");
        const collection = db.collection("superheroes");
        const anotherCollection = db.collection("names")

        const server = http.createServer(app);
        const io = socketIo(server);

        const changeStream = collection.watch(pipeline);
        changeStream.on("change", function (change) {
            console.log(change);
            // Fetch and broadcast the updated document count to connected clients
            collection.countDocuments({}, (err, count) => {
                if (!err) {
                    io.emit("documentCount", { count });
                }
            });
        });
        const anotherChangeStream = anotherCollection.watch(pipeline);
        anotherChangeStream.on("change", function (change) {
            console.log(change);
            // Fetch and broadcast the updated document count to connected clients for the "names" collection
            anotherCollection.countDocuments({}, (err, countNames) => {
                if (!err) {
                    io.emit("documentNamesCount", { countNames, collection: "names" });
                }
            });
        });

        // Function to add a new document to the collection every 10 seconds
        const addDocumentEvery5Seconds = () => {
            setInterval(() => {
                const superhero = {
                    name: `Superhero_${new Date().getTime()}`,
                    power: "Superpower"
                };

                collection.insertOne(superhero, (err) => {
                    if (err) {
                        console.error("Error inserting document:", err);
                    } else {
                        console.log("Document added:");
                    }
                });
            }, 5000);
        };
        const addDocumentEvery3sec = () => {
            setInterval(() => {
                const names = {
                    name: `names_${new Date().getTime()}`,
                    client: "maher"
                };

                anotherCollection.insertOne(names, (err) => {
                    if (err) {
                        console.error("Error inserting document:", err);
                    } else {
                        console.log("Document Names added:");
                    }
                });
            }, 3000);
        };
        // Start adding documents
        addDocumentEvery5Seconds();
        addDocumentEvery3sec();


        io.on("connection", (socket) => {
            console.log("Client connected");

            // Send the initial document count to the connected client for "superheroes" collection
            collection.countDocuments({}, (err, count) => {
                if (!err) {
                    socket.emit("documentCount", { count });
                }
            });

            // Send the initial document count to the connected client for "names" collection
            anotherCollection.countDocuments({}, (err, countNames) => {
                if (!err) {
                    socket.emit("documentNamesCount", { count: countNames }); // Use a consistent event name
                }
            });

            socket.on("disconnect", () => {
                console.log("Client disconnected");
            });
        });

        server.listen(port, () => {
            console.log(`Server is running on http://localhost:${port}`);
        });
    })
    .catch(err => {
        console.error(err);
    });
