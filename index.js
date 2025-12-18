const express=require('express')
const cors=require('cors')
require('dotenv').config()
const port=process.env.PORT||3000
const { MongoClient, ServerApiVersion, Db } = require('mongodb');
const app=express()
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ufivfja.mongodb.net/?appName=Cluster0`;

app.use(express.json())
app.use(cors())

app.get('/',(req,res)=>{
    res.send("My server is working")
})


const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const db=client.db('zap_DB')
    const parcelsCollection=db.collection('parcels')
    
    //parcels api

    app.post('/parcels', async(req,res)=>{
        const newParcel=req.body
        const result=await parcelsCollection.insertOne(newParcel)
        res.send(result)
    })

   app.get('/parcels', async (req, res) => {
  const email = req.query.email
  let query = {}

  if (email) {
    query = { senderEmail: email }
  }

  const result = await parcelsCollection.find(query).toArray()
  res.send(result)
})

    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.listen(port,()=>{
    console.log('port is running on ', port);
    
})