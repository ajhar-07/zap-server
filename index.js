const express=require('express')
const cors=require('cors')
require('dotenv').config()
const port=process.env.PORT||3000

// function generateTrackingId() {
//   const PREFIX = "PRC"; 
//   const COUNTRY = "BD"; 

//   const now = new Date();
//   const date =
//     now.getFullYear().toString() +
//     String(now.getMonth() + 1).padStart(2, "0") +
//     String(now.getDate()).padStart(2, "0");

//   const random = Math.floor(100000 + Math.random() * 900000);

//   return `${PREFIX}-${COUNTRY}-${date}-${random}`;
// }


const { MongoClient, ServerApiVersion, Db, ObjectId } = require('mongodb');
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
        newParcel.createdAt=new Date()
        const result=await parcelsCollection.insertOne(newParcel)
        res.send(result)
    })

  app.delete('/parcels/:id', async(req,res)=>{
    const id=req.params.id
    const query={_id: new ObjectId(id)}
    const result= await parcelsCollection.deleteOne(query)
    res.send(result)
  })


   app.get('/parcels', async (req, res) => {
  const email = req.query.email
  const options={sort:{createdAt:-1}}
  let query = {}

  if (email) {
    query = { senderEmail: email }
  }

  const result = await parcelsCollection.find(query,options).toArray()
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