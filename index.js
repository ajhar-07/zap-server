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
const stripe = require('stripe')(process.env.PAYMENT_STRIPE)
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
    const paymentCollection=db.collection('payments')
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

  app.get('/parcels/:id', async(req,res)=>{
    const id=req.params.id
    const query={_id: new ObjectId(id)}
    const result=await parcelsCollection.findOne(query)
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

//payment related API
app.post('/payment-checkout-session', async (req, res) => {
  try {
    const paymentInfo = req.body;
    const amount = parseInt(paymentInfo.cost) * 100;

    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: amount,
            product_data: {
              name: paymentInfo.parcelName,
            },
          },
          quantity: 1,
        },
      ],
      customer_email: paymentInfo.senderEmail,
      metadata: {
        parcelId: paymentInfo.parcelId,
        parcelName:paymentInfo.parcelName,
      },
      mode: 'payment',
      success_url: `${process.env.SITE_DOMAIN}/dashboard/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.SITE_DOMAIN}/dashboard/payment-cancelled`,
    });

    res.send({ url: session.url });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: error.message });
  }
});




//payment old
app.post('/create-checkout-session', async(req,res)=>{
  const paymentInfo=req.body
  const amount=parseInt(paymentInfo.cost)*100
   const session = await stripe.checkout.sessions.create({
    line_items: [
      {
        // Provide the exact Price ID (for example, price_1234) of the product you want to sell
       price_data:{
        currency:'usd',
        unit_amount:amount,
        product_data:{
          name:paymentInfo.parcelName,

        }
       },
        quantity: 1,
      },
    ],
    customer_email:paymentInfo.senderEmail,
    metadata:{
      parcelId:paymentInfo.id,

    },
    mode: 'payment',
    success_url: `${process.env.SITE_DOMAIN}/dashboard/payment-success`,
    cancel_url: `${process.env.SITE_DOMAIN}/dashboard/payment-cancelled`,
  });
 console.log(session);
 res.send({url:session.url})
 
})


app.patch('/payment-success', async(req,res)=>{
  const sessionId=req.query.session_id
 const session=await stripe.checkout.sessions.retrieve(sessionId)
 console.log(session);
 if(session.payment_status==="paid"){
  const parcelId = session.metadata.parcelId; 

  const query={_id:new ObjectId(parcelId)}
  const update={
    $set:{
      paymentStatus:'paid',

    }
  }

  const result=await parcelsCollection.updateOne(query,update)
  const payment={
    amount:session.amount_total/100,
    currency:session.currency,
    customerEmail:session.customer_email,
    parcelId:session.metadata.parcelId,
    parcelName:session.metadata.parcelName,
    transactionId:session.payment_intent,
    paymentStatus:session.payment_status,
    paidAt:new Date(),
    trackingId:'',



  }

  if(session.payment_status==='paid'){
       const result= await paymentCollection.insertOne(payment)
       res.send({success:true,paymentInfo:resultPayment,modifyParcel:result})
  }
  // res.send(result)
 }
  res.send({success:false})
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