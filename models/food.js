const mongoose = require('mongoose')

const foodSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    amount:{
        type: Number,
        required: true
    },
    amountUnit:{
        type: String,
        required: true
    },
    description: {
        type: String,
    },
    tag: {
        type: String,
        required: true
    },
    imageUrl: {
        type: String,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    }
},{ timestamps: true })

module.exports = mongoose.model('Food', foodSchema)