const express = require('express')
router = express.Router()

const User = require('../models/user')

const bcrypt = require('bcrypt')
const jwt = require("jsonwebtoken");

const {ObjectId} = require("mongodb");

router.post('/register', async (req, res) => {
    try {
        let user = await User.findOne({username: req.body.username,})

        if (!user){
            const newPass = req.body.password

            const salt = await bcrypt.genSalt()
            const hashed = await bcrypt.hash(newPass, salt)
            const user = new User({
                _id: new ObjectId(),
                username: req.body.username,
                password: hashed,
                created_at: new Date(),
                updated_at: new Date()
            });

            await user.save()

            return res.status(200).json({status: 200})
        }
        else return res.status(400).json({status: 400, error: "The username has already existed"})
    } catch (error) {
        return res.status(500).json({status: 500, error: "Internal Server Error"})
    }
})
router.post('/login', async (req,res)=>{
    const {username, password} = req.body;

    const user = await User.findOne({username});

    if(!user){
        return res.status(404).json({ status: 404, error: "User Not found"});
    }

    res.user = user;

    try {
        if (await bcrypt.compare(password, user.password)){
            const token = jwt.sign({ username: user.username }, process.env.JWT_KEY);
            return res.status(200).json({ status:200, accessToken:token, username:user.username});
        }
        return res.status(401).json({status: 401, error:"Invalid password"})

    } catch (error) {
        return res.status(500).json({status: 500, error:"Internal server error"})
    }
})

module.exports = router
module.exports.router = express()