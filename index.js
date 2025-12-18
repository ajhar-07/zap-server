const express=require('express')
const cors=require('cors')
require('dotenv').config()
const port=process.env.PORT||3000

const app=express()

app.use(express.json())
app.use(cors())

app.get('/',(req,res)=>{
    res.send("My server is working")
})

app.listen(port,()=>{
    console.log('port is running on ', port);
    
})