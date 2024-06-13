const express = require('express')
router = express.Router()

const {ObjectId} = require('mongodb');
const verifyToken = require('../middleware/authentication')
const User = require('../models/user');
const BookmarkRecipe = require('../models/bookmarkRecipe');
const Recipe = require("../models/recipe");


router.post('/', verifyToken, async(req, res) => {
    const {id} = req.body
    try{
        const user = await User.findOne({username: res.username}).select('_id');
        const bookmark = new BookmarkRecipe({
            _id: new ObjectId(),
            userId: user._id,
            recipeId: id
        })
        await bookmark.save();
        return res.status(200).json({status: 200})
    } catch (error) {
        if (error.code) return res.status(error.code).json({status: error.code, error: error.error})
        else return res.status(500).json({status: 500, error:"Internal server error"})
    }
});

router.get('/', verifyToken, async(req, res) => {
    const search = req.query.searchText || "";
    let bookmarkRecipeList;
    try{
        const user = await User.findOne({ username: res.username }).select('_id');
        const bookmarkRecipeIds = await BookmarkRecipe.find({ userId: user._id })
            .select('recipeId')
            .lean();

        const recipeIds = bookmarkRecipeIds.map(bookmark => bookmark.recipeId);

        if (search) {
            bookmarkRecipeList = await Recipe.find({_id: { $in: recipeIds }, name: { $regex: search, $options: 'i'}})
                .select('-createdAt -updatedAt -userId -steps -__v');
        } else {
            bookmarkRecipeList = await Recipe.find({ _id: { $in: recipeIds } })
                .select('-createdAt -updatedAt -userId -__v -steps')
                .lean();
        }

        return res.status(200).json({status: 200, bookmarkRecipeList: bookmarkRecipeList})
    } catch (error) {
        if (error.code) return res.status(error.code).json({status: error.code, error: error.error})
        else return res.status(500).json({status: 500, error:"Internal server error"})
    }
});

router.delete('/', verifyToken, async(req, res) => {
    const {id} = req.query
    try{
        const user = await User.findOne({username: res.username}).select('_id');

        await BookmarkRecipe.findOneAndDelete({ userId: user._id, recipeId: id });

        return res.status(200).json({status: 200})
    } catch (error) {
        if (error.code) return res.status(error.code).json({status: error.code, error: error.error})
        else return res.status(500).json({status: 500, error:"Internal server error"})
    }
});

module.exports = router
module.exports.router = express()