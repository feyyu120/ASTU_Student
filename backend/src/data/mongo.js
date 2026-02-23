import mongoose from "mongoose";
import "dotenv/config"

const Db = async () => {
    try{
    const con = await mongoose.connect(process.env.MONGO_URL)
    console.log("database is correctly connected")
    }catch(error){
        console.log("error found connecting to database",error) 
        process.exit(1)
    }
   
}


export default Db;










