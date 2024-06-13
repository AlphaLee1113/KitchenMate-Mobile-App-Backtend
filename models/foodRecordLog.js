const mongoose = require('mongoose')

const foodRecordLogSchema = new mongoose.Schema({
    amount:{
        type: Number,
        required: true
    },
    editor: {
        type: String,
        required: true
    },
    foodId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    date: {
        type: Date
    }
},{ timestamps: true })

module.exports = mongoose.model('FoodRecordLog', foodRecordLogSchema)