const mongoose = require('mongoose')

const ingredientsSchema = new mongoose.Schema({
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
    recipeId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
})

module.exports = mongoose.model('Ingredients', ingredientsSchema)