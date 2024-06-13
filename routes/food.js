const express = require('express')
router = express.Router()

const User = require('../models/user')
const Food = require('../models/food')
const FoodRecord = require('../models/foodRecord')
const {ObjectId} = require("mongodb");
const verifyToken = require("../middleware/authentication")
const upload = require("../middleware/upload")

const fs = require('fs')

router.get('/', verifyToken, async(req, res) => {
    try{
        const search = req.query.searchText || "";
        const user = await User.findOne({username: res.username}).select('_id');
        const query = { userId: user._id };
        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }
        const foodList = await Food.find(query).select('-createdAt -updatedAt -userId -__v');
        res.status(200).json({status:200, foodList:foodList});
    } catch (error) {
        if (error.code) res.status(error.code).json({status: error.code, error: error.error})
        else res.status(500).json({status: 500, error:"Internal server error"})
    }
});

// router.get('/expiredFood', verifyToken, async(req, res) => {
//     try{
//         const search = req.query.searchText || "";
//         const user = await User.findOne({username: res.username}).select('_id');
//         const query = { userId: user._id };
//         if (search) {
//             query.name = { $regex: search, $options: 'i' };
//         }
//         const currentDate = new Date();
//
//         query.$or = [
//             { expiredDate: { $lte: currentDate } },
//             { expiredDate: { $gte: currentDate, $lt: new Date(currentDate.getTime() + 2 * 24 * 60 * 60 * 1000) } }
//         ];
//         query.amount = { $ne: 0 };
//
//         const expiredfoodList = await FoodRecord.find(query)
//             .select('-createdAt -updatedAt -userId -__v')
//             .sort({ expiredDate: 1 });
//         res.status(200).json({status:200, expiredfoodList:expiredfoodList});
//     } catch (error) {
//         if (error.code) res.status(error.code).json({status: error.code, error: error.error})
//         else res.status(500).json({status: 500, error:"Internal server error"})
//     }
// });

router.post('/', verifyToken, upload.single('image'), async(req, res) => {
    let imageUrl = null;
    if(req.file){
        imageUrl = req.file.path
    }
    const {name, amountUnit, description, tag} = req.body
    if(!name) {
        if(imageUrl) fs.unlinkSync(req.file.path);
        return res.status(400).json({status: 400, error: "Missing required field!"})
    }
    try{
        const user = await User.findOne({username: res.username}).select('_id');
        const foundFood = await Food.findOne({name: name, userId: user._id});
        if(foundFood) {
            if(imageUrl) fs.unlinkSync(req.file.path);
            return res.status(400).json({status: 400, error: "Duplicate food name. Please edit the existing food or change the name."})
        }
        const food = new Food({
            _id: new ObjectId(),
            name: name,
            amount: 0,
            amountUnit: amountUnit,
            description: description,
            tag: tag,
            imageUrl: imageUrl ? imageUrl : "uploads\\always\\recipe\\egg.png",
            userId: user._id,
        })
        await food.save();
        return res.status(200).json({status: 200})
    } catch (error) {
        fs.unlinkSync(req.file.path);
        if (error.code) return res.status(error.code).json({status: error.code, error: error.error})
        else return res.status(500).json({status: 500, error:"Internal server error"})
    }
});

// router.delete('/confirmExpired', verifyToken, async(req, res) => {
//     const {id} = req.body
//     const foodRecord = await FoodRecord.findOne({_id: id});
//     if (!foodRecord) {
//         return res.status(400).json({status: 400, error: "Cannot find this food record"})
//     }
//     const foundFood = await Food.findOne({_id: foodRecord.foodId});
//     if(!foundFood) {
//         return res.status(400).json({status: 400, error: "Cannot find food with this record"})
//     }
//     const updateAmount = foundFood.amount - foodRecord.amount
//     if(updateAmount < 0) {
//         return res.status(400).json({status: 400, error: "The amount will be negative!"})
//     }
//     try{
//         await FoodRecord.deleteOne({ _id: id });
//
//         foundFood.amount = updateAmount;
//         await foundFood.save();
//
//         return res.status(200).json({status: 200})
//     } catch (error) {
//         if (error.code) return res.status(error.code).json({status: error.code, error: error.error})
//         else return res.status(500).json({status: 500, error:"Internal server error"})
//     }
// });


module.exports = router
module.exports.router = express()