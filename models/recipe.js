const mongoose = require('mongoose')

const recipeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    steps: {
        type: [String],
        required: true
    },
    imageUrl: {
        type: String,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
},{ timestamps: true })

module.exports = mongoose.model('Recipe', recipeSchema)