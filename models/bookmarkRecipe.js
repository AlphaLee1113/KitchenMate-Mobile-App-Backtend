const mongoose = require('mongoose')

const bookmarkSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    recipeId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
})

module.exports = mongoose.model('BookmarkRecipe', bookmarkSchema)