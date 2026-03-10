const express = require('express')
const { createUser, editUser, deleteUser,  getUser, login, getMe, verifyUser, getAllUser, requestOtp, forgotPassword, changePassword } = require('../controllers/user.controller')
const router = express.Router()

router.post('/register', createUser)
router.patch('/edituser/:id', editUser)
router.delete('/deleteUser/:id' , deleteUser)
router.get('/allusers',verifyUser,getAllUser )
router.get('/getuser/:id', getUser)
router.post('/login', login )
router.post('/request-otp', requestOtp )
router.post('/forgot-password', forgotPassword )
router.post('/change-password',verifyUser, changePassword )



router.post('/me', verifyUser, getMe )





module.exports=router
