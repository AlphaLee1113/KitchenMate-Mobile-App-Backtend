const express = require('express')
router = express.Router()

const {ObjectId} = require('mongodb');
const verifyToken = require('../middleware/authentication')
const upload = require('../middleware/upload')

const fs = require('fs')
const User = require('../models/user');
const Food = require('../models/food')
const Recipe = require('../models/recipe')
const Ingredient = require('../models/ingredients')
const BookMarkRecipe = require('../models/bookmarkRecipe')

router.get('/',  async(req, res) => {
    const search = req.query.searchText || "";
    let recipeList;
    try {
        if (search) {
            recipeList = await Recipe.find({name: { $regex: search, $options: 'i'}})
                .select('-createdAt -updatedAt -userId -steps -__v');
        } else {
            recipeList = await Recipe.find()
                .select('-createdAt -updatedAt -userId -steps -__v');
        }
        res.status(200).json({status: 200, recipeList: recipeList});
    } catch (error) {
        if (error.code) res.status(error.code).json({status: error.code, error: error.error})
        else res.status(500).json({status: 500, error: "Internal server error"})
    }
});

router.get('/getRecipeListByUser', verifyToken, async(req, res) => {
    try {
        const user = await User.findOne({username: res.username})
        // console.log("username is", res.username)
        recipeList = await Recipe.find({userId: user._id}).select('-createdAt -updatedAt -userId -steps -__v');
        res.status(200).json({status: 200, recipeList: recipeList});
    } catch (error) {
        // console.log("error is", error)
        if (error.code) res.status(error.code).json({status: error.code, error: error.error})
        else res.status(500).json({status: 500, error: "Internal server error"})
    }
});

router.get('/compare/:recipeId',  verifyToken, async(req, res) => {
    const { recipeId } = req.params
    try {
        const ingredients = await Ingredient.find({ recipeId }).select('-createdAt -updatedAt -__v -recipeId')
        if(ingredients.length === 0) {
            return res.status(404).json({status: 404, error: "no ingredients of this recipe can be found!"})
        }

        const user = await User.findOne({ username: res.username }).select('_id');
        const foodItems = await Food.find({ userId: user._id });

        const ingredientsList = ingredients.map((ingredient) => {
            const matchingFoodItem = foodItems.find((food) =>
                food.name.toLowerCase() === ingredient.name.toLowerCase()
            );

            if (matchingFoodItem) {
                if (matchingFoodItem.amount >= ingredient.amount) {
                    return {
                        ...ingredient.toObject(),
                        status: 'enough',
                    };
                } else {
                    return {
                        ...ingredient.toObject(),
                        status: 'not enough',
                    };
                }
            } else {
                return {
                    ...ingredient.toObject(),
                    status: 'not available',
                };
            }
        });

        return res.status(200).json({ status: 200, ingredientsList: ingredientsList });

    } catch (error) {
        if (error.code) res.status(error.code).json({status: error.code, error: error.error})
        else res.status(500).json({status: 500, error: "Internal server error"})
    }
});

router.get('/getRecipeDetails',  async(req, res) => {
    try{
        const {id, username} = req.query
        const recipe = await Recipe.findOne({_id: id}).select('-createdAt -updatedAt -userId -__v')
        const ingredients = await Ingredient.find({recipeId: id}).select('-createdAt -updatedAt -__v')

        if(!recipe || !ingredients) {
            return res.status(404).json({status: 404, error: "Recipe cannot be found!"})
        }
        const user = await User.findOne({username});
        const bookmark = await BookMarkRecipe.findOne({ recipeId:id, userId:user._id });

        let isBookmarked = false;

        if (bookmark) {
            isBookmarked = true;
        }
        const recipeDetails = {
            name: recipe.name,
            steps: recipe.steps,
            imageUrl: recipe.imageUrl,
            ingredients: ingredients.map(ingredient => ({
                name: ingredient.name,
                amount: ingredient.amount,
                amountUnit: ingredient.amountUnit
            })),
            isBookmarked: isBookmarked
        };
        res.status(200).json({status:200, recipeDetails:recipeDetails});
    } catch (error) {
        if (error.code) res.status(error.code).json({status: error.code, error: error.error})
        else res.status(500).json({status: 500, error:"Internal server error"})
    }
});

router.post('/', verifyToken, upload.single('image'), async(req, res) => {
    let imageUrl = null;
    if(req.file){
        imageUrl = req.file.path
    }
    const {name, steps, ingredients} = req.body
    if(!name || !steps || !ingredients) {
        if(imageUrl) fs.unlinkSync(req.file.path)
        return res.status(400).json({status: 400, error: "Missing required field!"})
    }
    try{
        const user = await User.findOne({username: res.username}).select('_id');
        const newRecipeId = new ObjectId();
        const recipe = new Recipe({
            _id: newRecipeId,
            name: name,
            steps: steps,
            imageUrl: imageUrl ? imageUrl : "uploads\\always\\recipe\\curry_chicken.jpg",
            userId: user._id,
        })
        await recipe.save();
        for (const ingredient of ingredients) {
            const newIngredient = new Ingredient({
                _id: new ObjectId(),
                name: ingredient.name,
                amount: ingredient.amount,
                amountUnit: ingredient.amountUnit,
                recipeId: newRecipeId
            });
            await newIngredient.save();
        }
        return res.status(200).json({status: 200})
    } catch (error) {
        fs.unlinkSync(req.file.path);
        if (error.code) return res.status(error.code).json({status: error.code, error: error.error})
        else return res.status(500).json({status: 500, error:"Internal server error"})
    }
});

router.put('/', verifyToken, upload.single('image'), async (req, res) => {
    let imageUrl = null;
    if (req.file) {
        imageUrl = "uploads\\always\\recipe\\curry_chicken.jpg";
    }
    const { id, name, steps, ingredients } = req.body.recipeDetails;
    if (!id || !name || !steps || !ingredients) {
        if (imageUrl) fs.unlinkSync(req.file.path);
        return res.status(400).json({ status: 400, error: "Missing required field!" });
    }
    try {
        const user = await User.findOne({ username: res.username }).select('_id');

        const existingRecipe = await Recipe.findOne({ _id: id, userId: user._id });
        if (!existingRecipe) {
            if (imageUrl) fs.unlinkSync(req.file.path);
            return res.status(404).json({ status: 404, error: "Recipe not found" });
        }

        if (imageUrl && existingRecipe.imageUrl) {
            fs.unlinkSync(existingRecipe.imageUrl);
        }

        existingRecipe.name = name;
        existingRecipe.steps = steps;
        existingRecipe.imageUrl = imageUrl;
        console.log("existingRecipe.imageUrl is", existingRecipe.imageUrl)
        await existingRecipe.save();

        await Ingredient.deleteMany({ recipeId: id });
        for (const ingredient of ingredients) {
            const newIngredient = new Ingredient({
                _id: new ObjectId(),
                name: ingredient.name,
                amount: ingredient.amount,
                amountUnit: ingredient.amountUnit,
                recipeId: id
            });
            await newIngredient.save();
        }

        return res.status(200).json({ status: 200 });
    } catch (error) {
        if (imageUrl) fs.unlinkSync(req.file.path);
        if (error.code) {
            return res.status(error.code).json({ status: error.code, error: error.error });
        } else {
            return res.status(500).json({ status: 500, error: "Internal server error" });
        }
    }
});



module.exports = router
module.exports.router = express()



