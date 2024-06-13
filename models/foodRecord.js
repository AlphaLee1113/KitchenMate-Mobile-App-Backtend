const mongoose = require('mongoose')

const foodRecordSchema = new mongoose.Schema({
    name:{
        type: String,
        required: true
    },
    amount:{
        type: Number,
        required: true
    },
    foodId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    expiredDate: {
        type: Date
    }
},{ timestamps: true })

module.exports = mongoose.model('FoodRecord', foodRecordSchema)