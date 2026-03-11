const UserModel = require("../models/user.model");
const bcrypt = require("bcrypt");
const { request, response } = require("express");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const mailSender = require("../middleware/mailer");
const OTPModel = require("../models/otp.model");


const ADMIN_EMAILS = [
  // "Nunyadamnbusiness0099@gmail.com",
  // "Holuwalovely@gmail.com",
  // "mubarakaduragbemi@gmail.com",
  // "aishaatinukeaisha@gmail.com",
  // "Ibrahim018.yi@gmail.com",
  "oluwaloniagboluaje@gmail.com"
];



let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'process.env.NODE_MAIL',
        pass: 'process.env.NODE_PASS'
    }
});

const createUser = async (request, response) => {
    const { lastName, email, password, firstName } = request.body;

    try {
        const saltround = await bcrypt.genSalt(10);

        const hashedPassword = await bcrypt.hash(password, saltround);

        const user = await UserModel.create({
            firstName,
            lastName,
            email,
            password: hashedPassword,
        });

        const renderMail = await mailSender("welcomeMail.ejs", {firstName, lastName} )

        let mailOptions = {
      from: process.env.NODE_MAIL,
      bcc: [email],
      subject: `Welcome, ${firstName}`,
      html: renderMail,
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log("Email sent: " + info.response);
    } catch (mailError) {
      console.error("Error sending welcome email:", mailError);
    }

    const token = await jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "5h",
    });

    response.status(201).send({
      message: "user created successfully",
      data: {
        lastName,
        email,
        firstName,
        roles: user.roles,
      },
      token,
    });
  } catch (error) {
    console.log(error);

    if (error.code == 11000) {
      response.status(400).send({
        message: "User already registered",
      });
    } else {
      response.status(400).send({
        message: "User creation failed",
      });
    }
  }
};

const login = async (request, response) => {
    const { email, password } = request.body;
    try {
        const isUser = await UserModel.findOne({ email });
        if (!isUser) {
            response.status(404).send({
                message: "Invalid credentials",
            });

            return;
        }

        const isMatch = await bcrypt.compare(password, isUser.password);
        if (!isMatch) {
            response.status(404).send({
                message: "Invalid credentials",
            });

            return;
        }
        const token = await jwt.sign({ id: isUser._id, roles: isUser.roles }, process.env.JWT_SECRET, {
            expiresIn: "5h",
        });
        response.status(200).send({
            message: "user logged in successfully",
            data: {
                email: isUser.email,
                roles: isUser.roles,
                firstName: isUser.firstName,
                lastName: isUser.lastName,
            },
            token,
        });
    } catch (error) {
        console.log(error);

        response.status(404).send({
            message: "Invalid credentials",
        });
    }
};

const editUser = async (request, response) => {
    const { firstName, lastName } = req.body;
    const { id } = request.params;

    try {
        let allowedUpdate = {
            ...(firstName && { firstName }),
            ...(lastName && { lastName }),
        };
        const newUser = await UserModel.findByIdAndUpdate(id, allowedUpdate);
        response.status(200).send({
            message: "User updated successfully",
        });
    } catch (error) {
        console.log(error);

        response.status(400).send({
            message: "User update failed",
        });
    }
};

const getAllUser = async (request, response) => {

    const user = request.user.roles
    try {

        if (user !== 'admin') {
            response.status(403).send({
                message: "Forbidden request"
            })

            return
        }

        let users = await UserModel.find().select("-roles -password");
        // let users = await UserModel.find()
        response.status(200).send({
            message: "users retrieved successfully",
            data: users,
        });
    } catch (error) {
        console.log(error);
        response.status(404).send({
            message: "users not found",
        });
    }
};

const deleteUser = async (request, response) => {
    const { id } = request.params;

    try {
        const isDeleted = await UserModel.findByIdAndDelete(id);

        if (!isDeleted) {
            response.status(400).send({
                message: "user failed to delete",
            });
            return;
        }

        response.status(204).send({
            message: "user deleted successfully",
        });
    } catch (error) {
        console.log(error);

        response.status(400).send({
            message: "user failed to delete",
        });
    }
};

const verifyUser = async (request, response, next) => {
    try {
        const token = request.headers["authorization"].split(" ")[1]
            ? request.headers["authorization"].split(" ")[1]
            : request.headers["authorization"].split(" ")[0];



        jwt.verify(token, process.env.JWT_SECRET, function (err, decoded) {
            if (err) {
                response.status(401).send({
                    message: "user unauthorized",
                });
                return;
            }

            console.log(decoded);

            request.user = decoded;

            next()
        });
    } catch (error) {
        response.status(401).send({
            message: "user unauthorized"
        })
    }
};


const getMe = async (request, response) => {
    console.log(request.user.id);
    // const {id} = req.user
    // console.log(id);

    try {
        const user = await UserModel.findById(request.user.id).select("-password")

        response.status(200).send({
            message: "user retreived successfully",
            data: user
        })
    } catch (error) {
        console.log(error);

        response.status(404).send({
            message: "user not found"
        })
    }


}


const requestOTP= async(request, response)=>{
  const {email}= request.body
  try {

    const isUser =await UserModel.findOne({email})

    if (!isUser){
        response.status(404).send({
            message: "account not found"
        })
    }

    const sendOTP= otpgen.generate(4, { upperCaseAlphabets: false, specialChars: false, lowerCaseAlphabets:false, digits:true })
    //save their otp and mail in the db
    //send them a mail with their otp
    const user =await OTPModel.create({email, otp:sendOTP})


    const otpMailContent = await mailSender('otpMail.ejs', {otp:sendOTP})

    response.status(200).send({
      message:"Otp sent successfully",
    })

    let mailOptions = {
            from: process.env.NODE_MAIL,
            to: { email,  },
            subject: `OTP CODE`,
            html:otpMailContent
        };



        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
            } else {
                console.log('Email sent: ' + info.response);
            }
        });



    
  } catch (error) {
    console.log(error);
    response.status(400).send({
      message:"Otp request failed",
    })
    
  }
}


const forgotPassword = async (request, response) => {
  const { otp, email, newPassword } = request.body;

  try {
    const isUser = await OTPModel.findOne({ email });

    if (!isUser) {
      response.status(404).send({
        message: "Invalid OTP",
      });

      return;
    }

    let isMatch = otp == isUser.otp;

    if (!isMatch) {
      response.status(404).send({
        message: "Invalid OTP",
      });

      return;
    }
    const saltRound = await bcrypt.genSalt(10);

    const hashedPassword = await bcrypt.hash(newPassword, saltRound);
    const user = await UserModel.findOneAndUpdate(
      { email },
      { password: hashedPassword },
      { new: true }
    );

    response.status(200).send({
      message:"Password updated successfully"
    })
  } catch (error) {

    response.status(404).send({
      message: "Invalid OTP",
    });
  }
};


const changePassword=async(request, response)=>{
  const{oldPassword, newPassword}= request.body

  try {

    const isUser= await UserModel.findById(request.user.id)

    if(!isUser){
      response.status(404).send({
        message: "Invalid User",
      });

      return
    }

    const isMatch = await bcrypt.compare(oldPassword, isUser.password)

    if(!isMatch){
      response.status(404).send({
        message: "Wrong password!",
      });

      return
    }


    const saltRound = await bcrypt.genSalt(10);

    const hashedPassword = await bcrypt.hash(newPassword, saltRound);

    const user = await UserModel.findByIdAndUpdate({_id:request.user.id}, {password:hashedPassword}, {new:true})

    response.status(200).send({
      message:"Password changed successfully"
    })
  } catch (error) {
    console.log(error);
    
    response.status(404).send({
      message: "Failed to change password",
    });
  }
}


module.exports = {
    createUser,
    editUser,
    getAllUser,
    deleteUser,
    login,
    verifyUser,
    getMe,
    requestOTP,
    forgotPassword,
    changePassword
};