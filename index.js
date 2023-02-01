const express = require("express");
const app = express();
const cors = require("cors");
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.l6rwfjc.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        const usersCollection = client.db("FitMe").collection("users");
        const transformationCollection = client.db("FitMe").collection("transformations");
        const batchesCollection = client.db("FitMe").collection("batches");

        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.send(result);
        })

        app.get('/users', async (req, res) => {
            const query = { role: "member" };
            const result = await usersCollection.find(query).toArray();
            res.send(result);
        })

        app.get('/user', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const result = await usersCollection.findOne(query);
            if (result) {
                res.send(result);
            }
        })

        app.post('/transformation', async (req, res) => {
            const transformation = req.body;
            const result = await transformationCollection.insertOne(transformation);
            res.send(result);
        })

        app.get('/transformation', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const result = await transformationCollection.find(query).toArray();
            res.send(result);
        })

        app.put('/batches', async (req, res) => {
            const batch = req.body;
            const filter = { _id: ObjectId(batch.id) };
            const options = { upsert: true };
            const updateBatch = {
                $set: batch
            }
            const result = await batchesCollection.updateOne(filter, updateBatch, options);
            res.send(result);
            console.log(batch, filter, result)
        })

        app.get('/batches', async (req, res) => {
            const query = {};
            const result = await batchesCollection.aggregate([
                {
                    $project: {
                        name: 1, link: 1, start: 1, end: 1, fees: 1,
                        "batchId": { $toString: "$_id" }
                    }
                },
                {
                    $lookup:
                    {
                        from: "users",
                        localField: "batchId",
                        foreignField: "batch",
                        as: "members"
                    }
                },
                {
                    $project: {
                        name: 1, link: 1, start: 1, end: 1, fees: 1,
                        members: { $size: "$members" }
                    }
                }
            ]).toArray();
            res.send(result);
        })

        app.delete('/batches/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await batchesCollection.deleteOne(query);
            res.send(result);
        })

    }
    finally {
    }
}
run().catch(console.dir)


app.get('/', (req, res) => {
    res.send("Server is Running");
})

app.listen(port, () => {
    console.log(`App is listening on port ${port}`)
})
