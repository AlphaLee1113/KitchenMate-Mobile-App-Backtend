const express = require('express')
router = express.Router()

const User = require('../models/user')
const Food = require('../models/food')
const FoodRecord = require('../models/foodRecord')
const FoodRecordLog = require('../models/foodRecordLog')
const {ObjectId} = require("mongodb");
const verifyToken = require("../middleware/authentication")


router.get('/:foodId', verifyToken, async(req, res) => {
    const foodId = req.params.foodId;
    try{
        const query = { foodId: foodId, amount: { $gt: 0 } };
        const foundFood = await Food.findOne({_id: foodId});

        if(!foundFood){
            return res.status(404).json({status: 404, error: "Cannot find this food"})
        }

        const foodRecordList = await FoodRecord.find(query)
            .select('-createdAt -updatedAt -userId -__v');

        res.status(200).json({status:200, foodRecordList:foodRecordList});
    } catch (error) {
        if (error.code) res.status(error.code).json({status: error.code, error: error.error})
        else res.status(500).json({status: 500, error:"Internal server error"})
    }
});
router.post('/', verifyToken, async(req, res) => {
    const {amount, foodId, expiredDate, id} = req.body
    if(!amount || !foodId || !expiredDate) {
        return res.status(400).json({status: 400, error: "Missing required field!"})
    }
    try{
        const user = await User.findOne({username: res.username}).select('_id');
        const foundFood = await Food.findOne({_id: foodId});
        if(!foundFood) {
            return res.status(400).json({status: 400, error: "Cannot find this food"})
        }
        const updateAmount = foundFood.amount + amount;
        if(updateAmount < 0) {
            return res.status(400).json({status: 400, error: "The total amount will be negative!"})
        }
        if(amount > 0){
            const newFoodRecordId =  new ObjectId()
            const foodRecord = new FoodRecord({
                _id: newFoodRecordId,
                name: foundFood.name,
                amount: amount,
                userId: user._id,
                foodId: foodId,
                expiredDate: expiredDate
            })
            await foodRecord.save()

            foundFood.amount = foundFood.amount + amount;
            await foundFood.save();

            const foodRecordLog = new FoodRecordLog ({
                _id: new ObjectId(),
                amount: amount,
                editor: res.username,
                foodId: foundFood._id,
                date: new Date()
            })
            await foodRecordLog.save();
        } else {
            return res.status(400).json({status: 400, error: "The amount cannot be zero!"})
        }
        return res.status(200).json({status: 200})
    } catch (error) {
        if (error.code) return res.status(error.code).json({status: error.code, error: error.error})
        else return res.status(500).json({status: 500, error:"Internal server error"})
    }
});

router.patch('/:foodRecordId', verifyToken, async(req, res) => {
    const foodRecordId = req.params.foodRecordId;
    const {amount} = req.body
    if (amount === undefined || amount === null) {
        return res.status(400).json({ status: 400, error: "Missing required field!" });
    }
    const foundFoodRecord = await FoodRecord.findOne({_id: foodRecordId});
    if(!foundFoodRecord) {
        return res.status(404).json({status: 404, error: "Cannot find this related food record"})
    }
    const foundFood = await Food.findOne({_id: foundFoodRecord.foodId});
    if(!foundFood) {
        return res.status(404).json({status: 404, error: "Cannot find this food"})
    }

    if(amount < 0) {
        return res.status(400).json({status: 400, error: "The amount cannot be negative!"})
    }
    const amountDifferece = foundFoodRecord.amount - amount
    const foodUpdateAmount = foundFood.amount - amountDifferece
    if(foodUpdateAmount < 0) {
        return res.status(400).json({status: 400, error: "The food total amount cannot be negative!"})
    }
    try{
        foundFoodRecord.amount = amount
        await foundFoodRecord.save();

        foundFood.amount = foodUpdateAmount
        await  foundFood.save();

        const foodRecordLog = new FoodRecordLog ({
            _id: new ObjectId(),
            amount: -amountDifferece,
            editor: res.username,
            foodId: foundFood._id,
            date: new Date()
        })
        await foodRecordLog.save();
        return res.status(200).json({status: 200})
    } catch (error) {
        if (error.code) return res.status(error.code).json({status: error.code, error: error.error})
        else return res.status(500).json({status: 500, error:"Internal server error"})
    }
});

module.exports = router
module.exports.router = express()