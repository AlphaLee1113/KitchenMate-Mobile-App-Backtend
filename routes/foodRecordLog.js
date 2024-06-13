const express = require('express')
router = express.Router()

const FoodRecordLog = require('../models/foodRecordLog')
const verifyToken = require("../middleware/authentication")

router.get('/:foodId',  verifyToken,async(req, res) => {
    const foodId = req.params.foodId;
    try {
        const foodRecordLogList = await FoodRecordLog.find({foodId: foodId}).select('-createdAt -updatedAt -__v');
        res.status(200).json({status: 200, foodRecordLogList: foodRecordLogList});
    } catch (error) {
        if (error.code) res.status(error.code).json({status: error.code, error: error.error})
        else res.status(500).json({status: 500, error: "Internal server error"})
    }
});

module.exports = router
module.exports.router = express()